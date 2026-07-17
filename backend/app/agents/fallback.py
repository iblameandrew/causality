"""Deterministic agent trees when LLM is off or fails."""

from __future__ import annotations

from app.agents.voice import build_voice_prompt
from app.domain.models import (
    AgentNode,
    Attributes,
    MemorySpec,
    MixtureFeature,
    RootFeature,
    SkillSpec,
)
from app.domain.tables import ELEMENT_COMBAT, role_for_point


def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def _attrs_for_root(root: RootFeature) -> Attributes:
    meta = role_for_point(root.point_name)
    bias = meta.get("bias", {})
    elem = ELEMENT_COMBAT.get((root.element or "").lower(), {})

    def b(key: str, default: float = 1.0) -> float:
        return float(bias.get(key, default)) * float(elem.get(key, 1.0))

    return Attributes(
        hp=_clamp(90 * b("hp", 1.0) * (0.9 + 0.1 * root.weight), 60, 180),
        speed=_clamp(1.0 * b("speed", 1.0), 0.5, 2.2),
        range=_clamp(1.5 * b("range", 1.0), 0.8, 4.0),
        armor=_clamp(1.0 * b("armor", 1.0), 0.5, 2.5),
        will=_clamp(1.0 * b("will", 1.0), 0.4, 2.0),
        empathy=_clamp(1.0 * b("empathy", 1.0), 0.3, 2.0),
        structure=_clamp(1.0 * b("structure", 1.0), 0.3, 2.0),
        damage=_clamp(10.0 * b("damage", 1.0), 5.0, 28.0),
    )


def _skills_for(role: str, style: str, link: str | None = None) -> list[SkillSpec]:
    base = [
        SkillSpec(
            id=f"{role}-strike",
            name="Direct Strike",
            kind="attack",
            cooldown=1.8,
            effect="strike",
            power=1.0,
        )
    ]
    if role in ("bond", "feeling", "dream"):
        base.append(
            SkillSpec(
                id=f"{role}-bolster",
                name="Field Bolster",
                kind="support",
                cooldown=4.0,
                effect="bolster",
                power=0.8,
            )
        )
    if role in ("force", "depth", "shock"):
        base.append(
            SkillSpec(
                id=f"{role}-surge",
                name="Pressure Surge",
                kind="attack",
                cooldown=3.5,
                effect="surge",
                power=1.35,
            )
        )
    if role in ("bound", "structure") or style == "structure":
        base.append(
            SkillSpec(
                id=f"{role}-brace",
                name="Brace Field",
                kind="passive",
                cooldown=0,
                effect="brace",
                power=0.6,
            )
        )
    if link == "harmony":
        base.append(
            SkillSpec(
                id="mix-attune",
                name="Attune",
                kind="support",
                cooldown=5.0,
                effect="attune",
                power=0.9,
            )
        )
    if link in ("tension", "challenge"):
        base.append(
            SkillSpec(
                id="mix-rupture",
                name="Rupture",
                kind="control",
                cooldown=4.5,
                effect="rupture",
                power=1.1,
            )
        )
    return base[:3]


def expand_root_fallback(root: RootFeature) -> AgentNode:
    attrs = _attrs_for_root(root)
    name = f"{root.style_label} {root.role_label}"
    skills_cap = _skills_for(root.role, root.style)
    mem_cap = [
        MemorySpec(
            title="Core Pattern",
            vignette=f"Carries the primary {root.role_label.lower()} signature shaped by {root.style_label.lower()}.",
        )
    ]
    summary_cap = f"Captain of {root.role_label} expressed through {root.style_label}."

    cadet_skills = skills_cap[:2]
    cadet_mem = [
        MemorySpec(
            title="First Form",
            vignette=f"Learned the outer edges of {root.style_label.lower()} practice.",
        )
    ]
    cadet_summary = f"Linguistic child of {name}; lighter and faster."
    cadet_name = f"{name} Cadet"

    echo_skills = skills_cap[:2]
    echo_mem = [
        MemorySpec(
            title="Side Channel",
            vignette="Remembers the quieter pathway of the same drive.",
        )
    ]
    echo_summary = f"Secondary expression of {root.role_label}."
    echo_name = f"{name} Echo"

    children = [
        AgentNode(
            feature_id=root.id,
            name=cadet_name,
            summary=cadet_summary,
            voice_prompt=build_voice_prompt(
                name=cadet_name,
                summary=cadet_summary,
                tier="squad",
                role=root.role,
                style=root.style,
                lineage=f"{root.role_label}/{root.style_label} → {cadet_name}",
                skills=cadet_skills,
                memories=cadet_mem,
            ),
            attributes=Attributes(
                hp=attrs.hp * 0.7,
                speed=attrs.speed * 1.15,
                range=attrs.range,
                armor=attrs.armor * 0.85,
                will=attrs.will * 0.9,
                empathy=attrs.empathy,
                structure=attrs.structure * 0.9,
                damage=attrs.damage * 0.75,
            ),
            skills=cadet_skills,
            memories=cadet_mem,
            children=[],
            tier="squad",
        ),
        AgentNode(
            feature_id=root.id,
            name=echo_name,
            summary=echo_summary,
            voice_prompt=build_voice_prompt(
                name=echo_name,
                summary=echo_summary,
                tier="squad",
                role=root.role,
                style=root.style,
                lineage=f"{root.role_label}/{root.style_label} → {echo_name}",
                skills=echo_skills,
                memories=echo_mem,
            ),
            attributes=Attributes(
                hp=attrs.hp * 0.65,
                speed=attrs.speed * 1.05,
                range=attrs.range * 1.1,
                armor=attrs.armor * 0.8,
                will=attrs.will * 0.85,
                empathy=attrs.empathy * 1.1,
                structure=attrs.structure * 0.85,
                damage=attrs.damage * 0.7,
            ),
            skills=echo_skills,
            memories=echo_mem,
            children=[],
            tier="squad",
        ),
    ]
    return AgentNode(
        feature_id=root.id,
        name=name,
        summary=summary_cap,
        voice_prompt=build_voice_prompt(
            name=name,
            summary=summary_cap,
            tier="captain",
            role=root.role,
            style=root.style,
            lineage=f"{root.role_label}/{root.style_label}",
            skills=skills_cap,
            memories=mem_cap,
        ),
        attributes=attrs,
        skills=skills_cap,
        memories=mem_cap,
        children=children,
        tier="captain",
    )


def expand_mixture_fallback(mix: MixtureFeature) -> AgentNode:
    roles = " / ".join(mix.parent_roles)
    styles = " / ".join(mix.parent_styles)
    name = f"{mix.link.title()} Hybrid"
    if len(mix.parent_styles) >= 2:
        name = f"{mix.parent_styles[0].title()}-{mix.parent_styles[1].title()} {mix.link.title()}"

    mult = 1.0 + 0.15 * mix.strength
    if mix.link in ("tension", "challenge"):
        dmg, arm, emp = 1.25, 0.85, 0.8
    elif mix.link == "harmony":
        dmg, arm, emp = 0.95, 1.05, 1.25
    elif mix.link == "fusion":
        dmg, arm, emp = 1.1, 1.1, 1.0
    else:
        dmg, arm, emp = 1.0, 1.0, 1.0

    attrs = Attributes(
        hp=100 * mult,
        speed=1.05,
        range=1.6,
        armor=1.0 * arm,
        will=1.1 * mult,
        empathy=1.0 * emp,
        structure=1.05,
        damage=12.0 * dmg * mult,
    )
    skills = _skills_for(
        mix.parent_roles[0] if mix.parent_roles else "drive",
        mix.parent_styles[0] if mix.parent_styles else "ignite",
        mix.link,
    )
    memories = [
        MemorySpec(
            title="Confluence",
            vignette=f"Two signatures meet as {mix.link}; neither fully cancels the other.",
        )
    ]
    summary = f"Mixture of {roles} via {mix.link} ({styles})."
    unit_name = name[:48]
    return AgentNode(
        feature_id=mix.id,
        name=unit_name,
        summary=summary,
        voice_prompt=build_voice_prompt(
            name=unit_name,
            summary=summary,
            tier="hybrid",
            role=roles,
            style=styles,
            lineage=f"mix:{mix.link}",
            skills=skills,
            memories=memories,
        ),
        attributes=attrs,
        skills=skills,
        memories=memories,
        children=[],
        tier="hybrid",
    )
