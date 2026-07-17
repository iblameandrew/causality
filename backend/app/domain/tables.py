"""Mundane role/style tables — astrology is a feature source only."""

from __future__ import annotations

# Planet / point name (Kerykeion) → role + spawn weight + combat bias keys
ROLE_TABLE: dict[str, dict] = {
    "Sun": {
        "role": "drive",
        "label": "Drive",
        "weight": 2.0,
        "bias": {"will": 1.2, "structure": 1.0, "empathy": 0.8},
    },
    "Moon": {
        "role": "feeling",
        "label": "Feeling",
        "weight": 2.0,
        "bias": {"will": 0.9, "structure": 0.7, "empathy": 1.3},
    },
    "Mercury": {
        "role": "mind",
        "label": "Mind",
        "weight": 1.4,
        "bias": {"will": 0.9, "structure": 1.0, "empathy": 1.0, "speed": 1.15},
    },
    "Venus": {
        "role": "bond",
        "label": "Bond",
        "weight": 1.3,
        "bias": {"will": 0.85, "structure": 0.9, "empathy": 1.35},
    },
    "Mars": {
        "role": "force",
        "label": "Force",
        "weight": 1.5,
        "bias": {"will": 1.25, "structure": 0.9, "empathy": 0.7, "damage": 1.2},
    },
    "Jupiter": {
        "role": "growth",
        "label": "Growth",
        "weight": 1.1,
        "bias": {"will": 1.1, "structure": 0.95, "empathy": 1.15, "hp": 1.15},
    },
    "Saturn": {
        "role": "bound",
        "label": "Bound",
        "weight": 1.2,
        "bias": {"will": 1.0, "structure": 1.4, "empathy": 0.75, "armor": 1.25},
    },
    "Uranus": {
        "role": "shock",
        "label": "Shock",
        "weight": 0.9,
        "bias": {"will": 1.05, "structure": 0.7, "empathy": 0.9, "speed": 1.25},
    },
    "Neptune": {
        "role": "dream",
        "label": "Dream",
        "weight": 0.85,
        "bias": {"will": 0.9, "structure": 0.65, "empathy": 1.4, "range": 1.2},
    },
    "Pluto": {
        "role": "depth",
        "label": "Depth",
        "weight": 0.9,
        "bias": {"will": 1.3, "structure": 1.1, "empathy": 0.8, "damage": 1.15},
    },
    "Ascendant": {
        "role": "mask",
        "label": "Mask",
        "weight": 1.8,
        "bias": {"will": 1.1, "structure": 1.0, "empathy": 1.0, "speed": 1.1},
    },
}

# Sign abbreviations / full → style + element + quality
SIGN_TABLE: dict[str, dict] = {
    "Ari": {"style": "ignite", "label": "Ignite", "element": "fire", "quality": "cardinal"},
    "Aries": {"style": "ignite", "label": "Ignite", "element": "fire", "quality": "cardinal"},
    "Tau": {"style": "endure", "label": "Endure", "element": "earth", "quality": "fixed"},
    "Taurus": {"style": "endure", "label": "Endure", "element": "earth", "quality": "fixed"},
    "Gem": {"style": "weave", "label": "Weave", "element": "air", "quality": "mutable"},
    "Gemini": {"style": "weave", "label": "Weave", "element": "air", "quality": "mutable"},
    "Can": {"style": "shelter", "label": "Shelter", "element": "water", "quality": "cardinal"},
    "Cancer": {"style": "shelter", "label": "Shelter", "element": "water", "quality": "cardinal"},
    "Leo": {"style": "radiate", "label": "Radiate", "element": "fire", "quality": "fixed"},
    "Vir": {"style": "refine", "label": "Refine", "element": "earth", "quality": "mutable"},
    "Virgo": {"style": "refine", "label": "Refine", "element": "earth", "quality": "mutable"},
    "Lib": {"style": "balance", "label": "Balance", "element": "air", "quality": "cardinal"},
    "Libra": {"style": "balance", "label": "Balance", "element": "air", "quality": "cardinal"},
    "Sco": {"style": "pierce", "label": "Pierce", "element": "water", "quality": "fixed"},
    "Scorpio": {"style": "pierce", "label": "Pierce", "element": "water", "quality": "fixed"},
    "Sag": {"style": "expand", "label": "Expand", "element": "fire", "quality": "mutable"},
    "Sagittarius": {"style": "expand", "label": "Expand", "element": "fire", "quality": "mutable"},
    "Cap": {"style": "structure", "label": "Structure", "element": "earth", "quality": "cardinal"},
    "Capricorn": {"style": "structure", "label": "Structure", "element": "earth", "quality": "cardinal"},
    "Aqu": {"style": "disrupt", "label": "Disrupt", "element": "air", "quality": "fixed"},
    "Aquarius": {"style": "disrupt", "label": "Disrupt", "element": "air", "quality": "fixed"},
    "Pis": {"style": "absorb", "label": "Absorb", "element": "water", "quality": "mutable"},
    "Pisces": {"style": "absorb", "label": "Absorb", "element": "water", "quality": "mutable"},
}

# Aspect name → mundane link + stance polarity (-1 conflict .. +1 affiliation)
ASPECT_LINK_TABLE: dict[str, dict] = {
    "conjunction": {"link": "fusion", "polarity": 0.35, "stance_weight": 1.0},
    "opposition": {"link": "challenge", "polarity": -0.85, "stance_weight": 1.1},
    "trine": {"link": "harmony", "polarity": 0.9, "stance_weight": 1.0},
    "square": {"link": "tension", "polarity": -0.8, "stance_weight": 1.05},
    "sextile": {"link": "harmony", "polarity": 0.7, "stance_weight": 0.9},
    "quincunx": {"link": "tension", "polarity": -0.35, "stance_weight": 0.5},
    "semi-sextile": {"link": "harmony", "polarity": 0.25, "stance_weight": 0.4},
    "semi-square": {"link": "tension", "polarity": -0.4, "stance_weight": 0.45},
    "sesquiquadrate": {"link": "tension", "polarity": -0.45, "stance_weight": 0.45},
    "quintile": {"link": "harmony", "polarity": 0.4, "stance_weight": 0.35},
}

ELEMENT_COMBAT: dict[str, dict] = {
    "fire": {"speed": 1.1, "damage": 1.1, "armor": 0.9},
    "earth": {"speed": 0.9, "damage": 0.95, "armor": 1.2},
    "air": {"speed": 1.15, "damage": 0.95, "range": 1.15},
    "water": {"speed": 1.0, "damage": 0.95, "empathy": 1.2, "armor": 1.0},
}

FACTION_COLORS = [
    "#e74c3c",
    "#3498db",
    "#2ecc71",
    "#f39c12",
    "#9b59b6",
    "#1abc9c",
    "#e67e22",
    "#34495e",
]


def faction_color(index: int) -> str:
    """Distinct color for any faction index (unlimited charts)."""
    if index < len(FACTION_COLORS):
        return FACTION_COLORS[index]
    # Golden-angle HSL cycle for arbitrarily many factions
    hue = (index * 137.508) % 360.0
    sat = 62 + (index % 5) * 5
    light = 48 + (index % 3) * 6
    return _hsl_to_hex(hue, sat, light)


def _hsl_to_hex(h: float, s: float, l: float) -> str:
    s /= 100.0
    l /= 100.0
    c = (1 - abs(2 * l - 1)) * s
    x = c * (1 - abs((h / 60.0) % 2 - 1))
    m = l - c / 2
    if h < 60:
        r, g, b = c, x, 0.0
    elif h < 120:
        r, g, b = x, c, 0.0
    elif h < 180:
        r, g, b = 0.0, c, x
    elif h < 240:
        r, g, b = 0.0, x, c
    elif h < 300:
        r, g, b = x, 0.0, c
    else:
        r, g, b = c, 0.0, x

    def ch(v: float) -> str:
        return f"{int(round((v + m) * 255)):02x}"

    return f"#{ch(r)}{ch(g)}{ch(b)}"


def normalize_sign(sign: str | None) -> str:
    if not sign:
        return "Ari"
    key = sign.strip()
    if key in SIGN_TABLE:
        return key
    # Kerykeion often uses 3-letter codes
    short = key[:3]
    if short in SIGN_TABLE:
        return short
    return "Ari"


def role_for_point(name: str) -> dict:
    return ROLE_TABLE.get(name, {
        "role": name.lower(),
        "label": name,
        "weight": 0.5,
        "bias": {"will": 1.0, "structure": 1.0, "empathy": 1.0},
    })


def style_for_sign(sign: str | None) -> dict:
    return SIGN_TABLE[normalize_sign(sign)]


def link_for_aspect(aspect: str | None) -> dict:
    if not aspect:
        return {"link": "tension", "polarity": 0.0, "stance_weight": 0.3}
    key = aspect.strip().lower().replace("_", "-")
    return ASPECT_LINK_TABLE.get(
        key,
        {"link": "tension", "polarity": 0.0, "stance_weight": 0.3},
    )
