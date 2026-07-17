"""Expand features into hierarchical agent trees."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from app.agents.fallback import expand_mixture_fallback, expand_root_fallback
from app.agents.llm_client import expand_with_llm
from app.agents.voice import build_voice_prompt
from app.config import Settings
from app.domain.models import (
    AgentNode,
    Attributes,
    FeatureGraph,
    MemorySpec,
    MixtureFeature,
    RootFeature,
    SkillSpec,
)


def _cache_key(payload: dict, prompt_version: str) -> str:
    raw = json.dumps(payload, sort_keys=True) + prompt_version
    return hashlib.sha256(raw.encode()).hexdigest()[:24]


def _load_cache(path: Path) -> dict | None:
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def _save_cache(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def _parse_agent(feature_id: str, data: dict, tier: str) -> AgentNode:
    attrs_raw = data.get("attributes") or {}
    attrs = Attributes(
        hp=float(attrs_raw.get("hp", 100)),
        speed=float(attrs_raw.get("speed", 1)),
        range=float(attrs_raw.get("range", 1.5)),
        armor=float(attrs_raw.get("armor", 1)),
        will=float(attrs_raw.get("will", 1)),
        empathy=float(attrs_raw.get("empathy", 1)),
        structure=float(attrs_raw.get("structure", 1)),
        damage=float(attrs_raw.get("damage", 10)),
    )
    skills = []
    for s in data.get("skills") or []:
        skills.append(
            SkillSpec(
                id=str(s.get("id", "skill")),
                name=str(s.get("name", "Skill")),
                kind=s.get("kind", "attack"),  # type: ignore[arg-type]
                cooldown=float(s.get("cooldown", 2)),
                effect=str(s.get("effect", "strike")),
                power=float(s.get("power", 1)),
            )
        )
    memories = [
        MemorySpec(title=str(m.get("title", "Memory")), vignette=str(m.get("vignette", "")))
        for m in (data.get("memories") or [])
    ]
    children = []
    for ch in data.get("children") or []:
        children.append(_parse_agent(feature_id, ch, "squad"))
    name = str(data.get("name", "Unit"))[:48]
    summary = str(data.get("summary", ""))
    skills_final = skills or [SkillSpec(id="strike", name="Strike", effect="strike")]
    voice = str(data.get("voice_prompt") or data.get("system_prompt") or "").strip()
    if not voice:
        voice = build_voice_prompt(
            name=name,
            summary=summary,
            tier=tier,
            role=str(data.get("role") or "") or None,
            style=str(data.get("style") or "") or None,
            lineage=str(data.get("lineage") or name),
            skills=skills_final,
            memories=memories,
        )
    return AgentNode(
        feature_id=feature_id,
        name=name,
        summary=summary,
        voice_prompt=voice,
        attributes=attrs,
        skills=skills_final,
        memories=memories,
        children=children,
        tier=tier,  # type: ignore[arg-type]
    )


def expand_root(root: RootFeature, settings: Settings) -> AgentNode:
    payload = {
        "kind": "root",
        "role": root.role,
        "role_label": root.role_label,
        "style": root.style,
        "style_label": root.style_label,
        "element": root.element,
        "quality": root.quality,
        "weight": root.weight,
    }
    key = _cache_key(payload, settings.prompt_version)
    cache_file = settings.cache_path / f"{key}.json"

    if settings.agent_mode == "llm":
        cached = _load_cache(cache_file)
        if cached:
            return _parse_agent(root.id, cached, "captain")
        llm = expand_with_llm(payload, settings)
        if llm:
            _save_cache(cache_file, llm)
            return _parse_agent(root.id, llm, "captain")

    return expand_root_fallback(root)


def expand_mixture(mix: MixtureFeature, settings: Settings) -> AgentNode:
    payload = {
        "kind": "mixture",
        "parent_roles": mix.parent_roles,
        "parent_styles": mix.parent_styles,
        "link": mix.link,
        "strength": mix.strength,
        "aspect": mix.aspect,
    }
    key = _cache_key(payload, settings.prompt_version)
    cache_file = settings.cache_path / f"{key}.json"

    if settings.agent_mode == "llm":
        cached = _load_cache(cache_file)
        if cached:
            return _parse_agent(mix.id, cached, "hybrid")
        llm = expand_with_llm(payload, settings)
        if llm:
            _save_cache(cache_file, llm)
            return _parse_agent(mix.id, llm, "hybrid")

    return expand_mixture_fallback(mix)


def expand_graph(graph: FeatureGraph, settings: Settings, include_mixtures: bool = True) -> list[AgentNode]:
    agents: list[AgentNode] = []
    for root in graph.roots:
        agents.append(expand_root(root, settings))
    if include_mixtures:
        for mix in graph.mixtures:
            agents.append(expand_mixture(mix, settings))
    return agents
