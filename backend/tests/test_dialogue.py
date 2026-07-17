from app.agents.voice import build_voice_prompt
from app.dialogue.service import converse
from app.domain.models import DialogueRequest, MemorySpec, SkillSpec, UnitRuntimeState
from app.agents.fallback import expand_root_fallback
from app.domain.models import RootFeature


def test_voice_prompt_nonempty():
    p = build_voice_prompt(
        name="Structure Drive",
        summary="Captain thought",
        tier="captain",
        role="drive",
        style="structure",
        lineage="Drive/Structure",
        skills=[SkillSpec(id="s", name="Strike")],
        memories=[MemorySpec(title="Core", vignette="pattern")],
    )
    assert "Structure Drive" in p
    assert "first person" in p.lower() or "Stay in character" in p


def test_root_agents_have_voice_prompts():
    root = RootFeature(
        id="c:root:Sun",
        chart_id="c",
        point_name="Sun",
        role="drive",
        role_label="Drive",
        style="structure",
        style_label="Structure",
        element="earth",
        quality="cardinal",
        weight=2.0,
    )
    agent = expand_root_fallback(root)
    assert agent.voice_prompt
    assert all(c.voice_prompt for c in agent.children)


def test_fallback_dialogue_who():
    req = DialogueRequest(
        unit_id="u1",
        name="Structure Drive",
        voice_prompt=build_voice_prompt(
            name="Structure Drive",
            summary="A structured drive-thought.",
            tier="captain",
            role="drive",
            style="structure",
        ),
        summary="A structured drive-thought.",
        lineage="Drive/Structure",
        role="drive",
        style="structure",
        runtime=UnitRuntimeState(energy=0.8, allies_near=2, enemies_near=1, alive=True),
        message="Who are you?",
    )
    res = converse(req)
    assert res.mode == "fallback"
    assert "Structure Drive" in res.reply
