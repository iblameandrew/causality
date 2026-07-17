"""Shared Pydantic models for API and pipeline."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class BirthInput(BaseModel):
    id: str | None = None
    name: str = "Unknown"
    year: int
    month: int = Field(ge=1, le=12)
    day: int = Field(ge=1, le=31)
    hour: int = Field(ge=0, le=23)
    minute: int = Field(ge=0, le=59)
    lat: float
    lng: float
    tz_str: str = "UTC"


class ChartPoint(BaseModel):
    name: str
    sign: str
    element: str | None = None
    quality: str | None = None
    position: float | None = None
    abs_pos: float | None = None
    house: str | None = None
    retrograde: bool | None = None
    role: str
    role_label: str
    style: str
    style_label: str
    weight: float


class NatalAspect(BaseModel):
    p1_name: str
    p2_name: str
    aspect: str
    orbit: float
    aspect_degrees: float | None = None
    link: str
    polarity: float
    strength: float


class NatalChart(BaseModel):
    chart_id: str
    name: str
    birth: BirthInput
    points: list[ChartPoint]
    aspects: list[NatalAspect]
    raw_context: str | None = None


class RootFeature(BaseModel):
    id: str
    chart_id: str
    kind: Literal["root"] = "root"
    point_name: str
    role: str
    role_label: str
    style: str
    style_label: str
    element: str | None = None
    quality: str | None = None
    weight: float
    retrograde: bool | None = None


class MixtureFeature(BaseModel):
    id: str
    chart_id: str
    kind: Literal["mixture"] = "mixture"
    parent_ids: list[str]
    parent_roles: list[str]
    parent_styles: list[str]
    link: str
    strength: float
    aspect: str
    weight: float


class FeatureGraph(BaseModel):
    chart_id: str
    name: str
    roots: list[RootFeature]
    mixtures: list[MixtureFeature]


class SkillSpec(BaseModel):
    id: str
    name: str
    kind: Literal["attack", "support", "control", "passive"] = "attack"
    cooldown: float = 2.0
    effect: str = "strike"
    power: float = 1.0


class MemorySpec(BaseModel):
    title: str
    vignette: str


class Attributes(BaseModel):
    hp: float = 100.0
    speed: float = 1.0
    range: float = 1.5
    armor: float = 1.0
    will: float = 1.0
    empathy: float = 1.0
    structure: float = 1.0
    damage: float = 10.0


class AgentNode(BaseModel):
    feature_id: str
    name: str
    summary: str = ""
    voice_prompt: str = Field(
        default="",
        description="System prompt that defines how this thought-agent speaks in dialogue.",
    )
    attributes: Attributes = Field(default_factory=Attributes)
    skills: list[SkillSpec] = Field(default_factory=list)
    memories: list[MemorySpec] = Field(default_factory=list)
    children: list[AgentNode] = Field(default_factory=list)
    tier: Literal["captain", "squad", "hybrid"] = "squad"


class RelationDriver(BaseModel):
    role_a: str
    role_b: str
    link: str
    weight: float
    aspect: str | None = None


class PartisanRelation(BaseModel):
    chart_a: str
    chart_b: str
    name_a: str
    name_b: str
    stance: Literal["conflict", "affiliation", "neutrality"]
    score: float
    drivers: list[RelationDriver] = Field(default_factory=list)


class UnitSpec(BaseModel):
    unit_id: str
    faction_id: str
    feature_id: str
    agent_path: list[str]
    name: str
    summary: str = ""
    voice_prompt: str = Field(
        default="",
        description="Conversational system prompt for dialogue with this unit.",
    )
    tier: Literal["captain", "squad", "hybrid"]
    lineage: str
    attributes: Attributes
    skills: list[SkillSpec]
    memories: list[MemorySpec]
    role: str | None = None
    style: str | None = None


class DialogueMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class UnitRuntimeState(BaseModel):
    hp: float | None = None
    max_hp: float | None = None
    energy: float | None = None
    allies_near: int | None = None
    enemies_near: int | None = None
    alive: bool | None = True
    faction_name: str | None = None


class DialogueRequest(BaseModel):
    unit_id: str
    match_id: str | None = None
    name: str
    voice_prompt: str
    summary: str = ""
    lineage: str = ""
    role: str | None = None
    style: str | None = None
    tier: str | None = None
    skills: list[SkillSpec] = Field(default_factory=list)
    memories: list[MemorySpec] = Field(default_factory=list)
    runtime: UnitRuntimeState = Field(default_factory=UnitRuntimeState)
    history: list[DialogueMessage] = Field(default_factory=list)
    message: str


class DialogueResponse(BaseModel):
    reply: str
    mode: Literal["llm", "fallback"]
    unit_id: str


class FactionManifest(BaseModel):
    chart_id: str
    name: str
    color: str
    roots: list[RootFeature]
    mixtures: list[MixtureFeature]
    agents: list[AgentNode]
    roster: list[UnitSpec]


class MapSpec(BaseModel):
    size: list[int] = Field(default_factory=lambda: [64, 64])
    seed: int = 42


class MatchManifest(BaseModel):
    match_id: str
    factions: list[FactionManifest]
    relations: list[PartisanRelation]
    map: MapSpec = Field(default_factory=MapSpec)
    meta: dict[str, Any] = Field(default_factory=dict)


class MatchOptions(BaseModel):
    max_units_per_faction: int = 24
    include_mixtures: bool = True
    max_mixtures_per_chart: int | None = None
    agent_mode: str | None = None
    map_seed: int | None = None


class MatchRequest(BaseModel):
    people: list[BirthInput]
    options: MatchOptions = Field(default_factory=MatchOptions)


class FeaturesRequest(BaseModel):
    person: BirthInput
    max_mixtures: int | None = None
