from app.domain.tables import faction_color
from app.match.service import _map_size_for_factions, _units_per_faction


def test_faction_colors_unique_for_many():
    colors = [faction_color(i) for i in range(48)]
    assert all(c.startswith("#") and len(c) == 7 for c in colors)
    # Most should be unique across a large set
    assert len(set(colors)) >= 40


def test_map_grows_with_factions():
    assert _map_size_for_factions(2) == [64, 64]
    assert _map_size_for_factions(10)[0] > 64
    assert _map_size_for_factions(100)[0] <= 160


def test_units_budget_for_many_factions():
    assert _units_per_faction(18, 2) == 18
    assert _units_per_faction(18, 20) < 18
    assert _units_per_faction(18, 50) >= 4
