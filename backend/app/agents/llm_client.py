"""SpaceXAI (xAI) OpenAI-compatible client."""

from __future__ import annotations

import json
from typing import Any

from app.config import Settings


def expand_with_llm(feature_payload: dict[str, Any], settings: Settings) -> dict[str, Any] | None:
    if not settings.xai_api_key:
        return None
    try:
        from openai import OpenAI
    except ImportError:
        return None

    client = OpenAI(api_key=settings.xai_api_key, base_url=settings.xai_base_url)
    system = (
        "You design RTS unit archetypes from abstract role+style features. "
        "Never use astrology jargon in names or summaries. "
        "Return ONLY valid JSON matching the schema: "
        '{"name": str, "summary": str, "voice_prompt": str, '
        '"attributes": {"hp":num,"speed":num,"range":num,"armor":num,"will":num,"empathy":num,"structure":num,"damage":num}, '
        '"skills":[{"id":str,"name":str,"kind":"attack|support|control|passive","cooldown":num,"effect":str,"power":num}], '
        '"memories":[{"title":str,"vignette":str}], '
        '"children":[{"name":str,"summary":str,"voice_prompt":str,"attributes":{...},"skills":[...],"memories":[...]}] } '
        "voice_prompt is a conversational system prompt (second person or direct persona instructions) "
        "so a user can dialogue with this thought-agent in character. "
        "Children depth max 2 units. Clamp attributes: hp 60-180, speed 0.5-2.2, damage 5-28, others 0.3-2.5. "
        "Skills effect must be one of: strike, surge, bolster, brace, attune, rupture."
    )
    user = json.dumps(feature_payload, ensure_ascii=False)
    try:
        # Prefer chat.completions for broad compatibility
        resp = client.chat.completions.create(
            model=settings.xai_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.7,
        )
        text = resp.choices[0].message.content or ""
        text = text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            lines = [ln for ln in lines if not ln.strip().startswith("```")]
            text = "\n".join(lines)
        return json.loads(text)
    except Exception:
        return None
