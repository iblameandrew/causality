"""Turn agent trees into unit rosters with caps."""

from __future__ import annotations

import uuid

from app.agents.voice import build_voice_prompt
from app.domain.models import (
    AgentNode,
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


def flatten_agents(
    agents: list[AgentNode],
    graph: FeatureGraph,
    faction_id: str,
    max_units: int,
) -> list[UnitSpec]:
    roots_by_id = {r.id: r for r in graph.roots}
    mixes_by_id = {m.id: m for m in graph.mixtures}

    # Prefer high-weight features
    weight_of = {}
    for r in graph.roots:
        weight_of[r.id] = r.weight
    for m in graph.mixtures:
        weight_of[m.id] = m.weight

    agents_sorted = sorted(
        agents, key=lambda a: weight_of.get(a.feature_id, 0.0), reverse=True
    )

    roster: list[UnitSpec] = []

    def add_node(node: AgentNode, path: list[str], force_tier: str | None = None) -> None:
        nonlocal roster
        if len(roster) >= max_units:
            return
        feat = roots_by_id.get(node.feature_id) or mixes_by_id.get(node.feature_id)
        role = getattr(feat, "role", None) if feat else None
        style = getattr(feat, "style", None) if feat else None
        if isinstance(feat, MixtureFeature):
            role = "/".join(feat.parent_roles)
            style = "/".join(feat.parent_styles)
        tier = force_tier or node.tier
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
        roster.append(
            UnitSpec(
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
        )
        for child in node.children:
            if len(roster) >= max_units:
                break
            add_node(child, names, force_tier="squad")

    for agent in agents_sorted:
        if len(roster) >= max_units:
            break
        add_node(agent, [])

    return roster
