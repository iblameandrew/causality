from app.agents.fallback import expand_root_fallback
from app.domain.models import FeatureGraph, RootFeature
from app.match.spawner import flatten_agents


def _root(name: str, weight: float = 1.0) -> RootFeature:
    return RootFeature(
        id=f"c:root:{name}",
        chart_id="c",
        point_name=name,
        role="drive" if name == "Sun" else "feeling",
        role_label="Drive" if name == "Sun" else "Feeling",
        style="structure",
        style_label="Structure",
        element="earth",
        quality="cardinal",
        weight=weight,
    )


def test_units_per_planet_respected():
    roots = [_root("Sun", 2.0), _root("Moon", 2.0)]
    agents = [expand_root_fallback(r) for r in roots]
    graph = FeatureGraph(chart_id="c", name="T", roots=roots, mixtures=[])
    for per in (1, 2, 3, 5, 8):
        roster = flatten_agents(
            agents, graph, "c", max_units=100, units_per_planet=per
        )
        # 2 planets × per units each
        assert len(roster) == 2 * per
        sun = [u for u in roster if u.feature_id == "c:root:Sun"]
        moon = [u for u in roster if u.feature_id == "c:root:Moon"]
        assert len(sun) == per
        assert len(moon) == per


def test_units_per_planet_one_is_captain_only():
    roots = [_root("Sun", 2.0)]
    agents = [expand_root_fallback(roots[0])]
    graph = FeatureGraph(chart_id="c", name="T", roots=roots, mixtures=[])
    roster = flatten_agents(agents, graph, "c", max_units=10, units_per_planet=1)
    assert len(roster) == 1
    assert roster[0].tier == "captain"
