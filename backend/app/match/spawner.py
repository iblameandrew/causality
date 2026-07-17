"""Turn agent trees into unit rosters with per-planet spawn counts."""

from __future__ import annotations

import uuid

from app.agents.voice import build_voice_prompt
from app.domain.models import (
    AgentNode,
    Attributes,
    FeatureGraph,
    MixtureFeature,
    RootFeature,
    UnitSpec,
)


def _lineage(root_or_mix: RootFeature | MixtureFeature | None, path: list[str]) -> str:
    if isinstance(root_or_mix, RootFeature):
        base = f"{root_or_mix.role_label}/{root_or_mix.style_label}"
    elif isinstance(root_or_mix, MixtureFeature):
        base = f"mix:{root_or_mix.link}"
    else:
        base = "unit"
    return " → ".join([base, *path]) if path else base


def _scale_attrs(attrs: Attributes, factor: float) -> Attributes:
    return Attributes(
        hp=max(40.0, attrs.hp * factor),
        speed=attrs.speed * (1.0 + (1.0 - factor) * 0.2),
        range=attrs.range,
        armor=max(0.4, attrs.armor * factor),
        will=max(0.3, attrs.will * factor),
        empathy=attrs.empathy,
        structure=max(0.3, attrs.structure * factor),
        damage=max(4.0, attrs.damage * factor),
    )


def _variant_child(template: AgentNode, index: int) -> AgentNode:
    """Clone a squad template as an extra planetary emanation."""
    labels = ["Cadet", "Echo", "Spark", "Shard", "Wisp", "Proxy", "Glyph", "Ember"]
    label = labels[index % len(labels)]
    suffix = f" {index + 1}" if index >= len(labels) else ""
    # Prefer naming off parent feature name
    base = template.name
    for strip in (" Cadet", " Echo", " Spark", " Shard", " Wisp", " Proxy", " Glyph", " Ember"):
        if base.endswith(strip):
            base = base[: -len(strip)]
            break
    name = f"{base} {label}{suffix}"[:48]
    factor = max(0.55, 0.78 - index * 0.03)
    summary = f"Planetary emanation #{index + 1} of {base}."
    node = AgentNode(
        feature_id=template.feature_id,
        name=name,
        summary=summary,
        voice_prompt="",
        attributes=_scale_attrs(template.attributes, factor),
        skills=list(template.skills),
        memories=list(template.memories),
        children=[],
        tier="squad",
    )
    node.voice_prompt = build_voice_prompt(
        name=name,
        summary=summary,
        tier="squad",
        role=None,
        style=None,
        lineage=name,
        skills=node.skills,
        memories=node.memories,
    )
    return node


def _nodes_for_planet(agent: AgentNode, units_per_planet: int) -> list[tuple[AgentNode, list[str], str]]:
    """
    Select/create up to units_per_planet units from a root planet agent tree.
    Order: captain first, then existing children, then synthesized variants.
    """
    n = max(1, int(units_per_planet))
    out: list[tuple[AgentNode, list[str], str]] = []

    # Captain
    out.append((agent, [], str(agent.tier or "captain")))
    if len(out) >= n:
        return out[:n]

    # Existing children
    for child in agent.children:
        out.append((child, [agent.name], "squad"))
        if len(out) >= n:
            return out[:n]

    # Pad with variants of last squad template (or captain if no children)
    template = agent.children[0] if agent.children else agent
    idx = 0
    while len(out) < n:
        variant = _variant_child(template, idx)
        out.append((variant, [agent.name], "squad"))
        idx += 1

    return out[:n]


def _emit_unit(
    node: AgentNode,
    path: list[str],
    tier: str,
    faction_id: str,
    roots_by_id: dict[str, RootFeature],
    mixes_by_id: dict[str, MixtureFeature],
) -> UnitSpec:
    feat = roots_by_id.get(node.feature_id) or mixes_by_id.get(node.feature_id)
    role = getattr(feat, "role", None) if feat else None
    style = getattr(feat, "style", None) if feat else None
    if isinstance(feat, MixtureFeature):
        role = "/".join(feat.parent_roles)
        style = "/".join(feat.parent_styles)
    names = path + [node.name]
    lineage = _lineage(feat, path)
    voice = (node.voice_prompt or "").strip()
    if not voice:
        voice = build_voice_prompt(
            name=node.name,
            summary=node.summary,
            tier=str(tier),
            role=role if isinstance(role, str) else None,
            style=style if isinstance(style, str) else None,
            lineage=lineage,
            skills=node.skills,
            memories=node.memories,
        )
    return UnitSpec(
        unit_id=str(uuid.uuid4()),
        faction_id=faction_id,
        feature_id=node.feature_id,
        agent_path=names,
        name=node.name,
        summary=node.summary,
        voice_prompt=voice,
        tier=tier,  # type: ignore[arg-type]
        lineage=lineage,
        attributes=node.attributes,
        skills=node.skills,
        memories=node.memories,
        role=role,
        style=style,
    )


def flatten_agents(
    agents: list[AgentNode],
    graph: FeatureGraph,
    faction_id: str,
    max_units: int,
    units_per_planet: int = 3,
) -> list[UnitSpec]:
    """
    Build roster:
    - Each root/planet agent contributes exactly `units_per_planet` units (capped by max_units).
    - Mixture agents contribute 1 hybrid each (if present).
    """
    roots_by_id = {r.id: r for r in graph.roots}
    mixes_by_id = {m.id: m for m in graph.mixtures}
    root_ids = set(roots_by_id.keys())
    mix_ids = set(mixes_by_id.keys())

    weight_of = {r.id: r.weight for r in graph.roots}
    weight_of.update({m.id: m.weight for m in graph.mixtures})

    root_agents = sorted(
        [a for a in agents if a.feature_id in root_ids],
        key=lambda a: weight_of.get(a.feature_id, 0.0),
        reverse=True,
    )
    mix_agents = sorted(
        [a for a in agents if a.feature_id in mix_ids],
        key=lambda a: weight_of.get(a.feature_id, 0.0),
        reverse=True,
    )

    roster: list[UnitSpec] = []
    per = max(1, int(units_per_planet))

    for agent in root_agents:
        if len(roster) >= max_units:
            break
        remaining = max_units - len(roster)
        want = min(per, remaining)
        for node, path, tier in _nodes_for_planet(agent, want):
            if len(roster) >= max_units:
                break
            roster.append(
                _emit_unit(node, path, tier, faction_id, roots_by_id, mixes_by_id)
            )

    for agent in mix_agents:
        if len(roster) >= max_units:
            break
        roster.append(
            _emit_unit(agent, [], str(agent.tier or "hybrid"), faction_id, roots_by_id, mixes_by_id)
        )

    return roster
