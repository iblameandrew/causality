from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.config import get_settings
from app.dialogue.service import converse
from app.domain.models import (
    BirthInput,
    DialogueRequest,
    FeaturesRequest,
    MatchRequest,
)
from app.match.service import build_match, features_for_person, get_match, natal_summary

router = APIRouter()


@router.get("/health")
def health():
    settings = get_settings()
    return {
        "ok": True,
        "agent_mode": settings.agent_mode,
        "llm_configured": bool(settings.xai_api_key),
    }


@router.post("/api/charts")
def create_chart(person: BirthInput):
    try:
        return natal_summary(person)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post("/api/features")
def create_features(body: FeaturesRequest):
    try:
        return features_for_person(body.person, body.max_mixtures)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post("/api/match")
def create_match(body: MatchRequest):
    if len(body.people) < 1:
        raise HTTPException(status_code=400, detail="Provide at least one birth chart")
    try:
        match = build_match(body.people, body.options)
        return match.model_dump()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get("/api/match/{match_id}")
def read_match(match_id: str):
    match = get_match(match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match.model_dump()


@router.post("/api/dialogue")
def unit_dialogue(body: DialogueRequest):
    """Speak with a single thought-unit using its conversational voice prompt."""
    try:
        return converse(body).model_dump()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
