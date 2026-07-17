"""Dialogue with individual thought-units via their voice prompts."""

from __future__ import annotations

from app.config import Settings, get_settings
from app.domain.models import DialogueRequest, DialogueResponse


def _runtime_block(req: DialogueRequest) -> str:
    r = req.runtime
    parts = []
    if r.faction_name:
        parts.append(f"Faction: {r.faction_name}")
    if r.alive is False:
        parts.append("State: downed / silenced on the field (still speak as residual thought).")
    else:
        parts.append("State: active on the field.")
    if r.hp is not None and r.max_hp is not None:
        parts.append(f"Vitality: {r.hp:.0f}/{r.max_hp:.0f}")
    if r.energy is not None:
        parts.append(f"Energization: {r.energy * 100:.0f}%")
    if r.allies_near is not None:
        parts.append(f"Allies nearby: {r.allies_near}")
    if r.enemies_near is not None:
        parts.append(f"Enemies nearby: {r.enemies_near}")
    return "Current field conditions:\n" + "\n".join(f"- {p}" for p in parts)


def _fallback_reply(req: DialogueRequest) -> str:
    """Persona-flavored reply without an LLM."""
    msg = req.message.strip().lower()
    role = (req.role or "presence").split("/")[0]
    style = (req.style or "focus").split("/")[0]
    name = req.name
    energy = req.runtime.energy if req.runtime.energy is not None else 0.6
    allies = req.runtime.allies_near or 0
    enemies = req.runtime.enemies_near or 0

    if not req.runtime.alive:
        return (
            f"I am {name}, still speaking from after-image. "
            f"My {role} pattern through {style} is thin now—ask carefully; "
            "downed thoughts answer in echoes."
        )

    if any(w in msg for w in ("who are you", "who r you", "what are you", "name")):
        return (
            f"I am {name}. Not the whole person—only a thought with agency: "
            f"{role} shaped by {style}. Lineage: {req.lineage or 'self'}. "
            f"{req.summary or 'I move when attention lets me.'}"
        )

    if any(w in msg for w in ("feel", "energy", "how are", "status", "hurt", "hp")):
        tone = "bright" if energy > 0.7 else "steady" if energy > 0.4 else "drained"
        crowd = (
            f"I feel {allies} kindred nearby"
            + (f" and {enemies} opposing thoughts pressing in" if enemies else "")
            + "."
        )
        return (
            f"My energization is {tone} ({energy * 100:.0f}%). {crowd} "
            f"As a {style} {role}-thought, pressure either steadies or scatters me."
        )

    if any(w in msg for w in ("ally", "friend", "help", "bond", "love")):
        if role in ("bond", "feeling", "dream"):
            return (
                f"I lean toward affiliation. {style} makes me open channels—"
                "if you stand near me, I will try to bolster rather than cut."
            )
        return (
            f"Bond is not my first language; I am {role} under {style}. "
            "I can stand with kin, but I keep my edge."
        )

    if any(w in msg for w in ("fight", "enemy", "attack", "war", "conflict")):
        if role in ("force", "depth", "shock"):
            return (
                f"Conflict clarifies me. Through {style}, I push until the field answers. "
                f"With {enemies} hostiles near, my will sharpens."
            )
        return (
            f"I do not seek battle first, yet when stances turn hard I act. "
            f"My {style} {role} will not dissolve under pressure."
        )

    if any(w in msg for w in ("memory", "remember", "past")):
        if req.memories:
            m = req.memories[0]
            return f"I remember '{m.title}': {m.vignette}"
        return "My memory is short—mostly pattern and motion."

    if any(w in msg for w in ("skill", "can you", "power", "ability")):
        if req.skills:
            names = ", ".join(s.name for s in req.skills[:3])
            return f"I carry these acts: {names}. They are how this thought moves the field."
        return "I move mostly by presence and contact."

    # Default reflective turn
    return (
        f"As {name}, I hear you. My {style} {role} answers from the field—"
        f"energy {energy * 100:.0f}%, {allies} allies, {enemies} foes in aura. "
        f"{req.summary or 'Speak again; I will answer as this thought, not the whole mind.'}"
    )


def _llm_reply(req: DialogueRequest, settings: Settings) -> str | None:
    if not settings.xai_api_key:
        return None
    try:
        from openai import OpenAI
    except ImportError:
        return None

    system = req.voice_prompt.strip()
    if not system:
        system = f"You are {req.name}, a thought-agent. Stay in character."
    system = (
        system
        + "\n\n"
        + _runtime_block(req)
        + "\n\nRespond only as this unit. No markdown fences. Keep 2–5 sentences unless asked for more."
    )

    messages: list[dict] = [{"role": "system", "content": system}]
    for h in req.history[-12:]:
        messages.append({"role": h.role, "content": h.content})
    messages.append({"role": "user", "content": req.message})

    try:
        client = OpenAI(api_key=settings.xai_api_key, base_url=settings.xai_base_url)
        resp = client.chat.completions.create(
            model=settings.xai_model,
            messages=messages,
            temperature=0.85,
        )
        text = (resp.choices[0].message.content or "").strip()
        return text or None
    except Exception:
        return None


def converse(req: DialogueRequest, settings: Settings | None = None) -> DialogueResponse:
    settings = settings or get_settings()
    if not req.message.strip():
        return DialogueResponse(
            reply="…",
            mode="fallback",
            unit_id=req.unit_id,
        )

    # Prefer LLM when configured (dialogue is interactive even if agents were fallback-built)
    if settings.xai_api_key and settings.agent_mode == "llm":
        reply = _llm_reply(req, settings)
        if reply:
            return DialogueResponse(reply=reply, mode="llm", unit_id=req.unit_id)

    # Also try LLM if key present even in fallback agent mode — dialogue is user-facing
    if settings.xai_api_key:
        reply = _llm_reply(req, settings)
        if reply:
            return DialogueResponse(reply=reply, mode="llm", unit_id=req.unit_id)

    return DialogueResponse(
        reply=_fallback_reply(req),
        mode="fallback",
        unit_id=req.unit_id,
    )
