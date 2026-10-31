"""Intent recognition, scheme alias matching, and topic detection."""
import re
from typing import Optional, List, Dict, Tuple, Any

SCHEME_ALIASES: Dict[str, List[str]] = {
    "pm-kisan": [
        "pm kisan", "pm-kisan", "pmkisan", "kisan samman nidhi", "kisan nidhi",
        "పీఎం కిసాన్", "పిఎం కిసాన్", "రైతు సమ్మాన్ నిధి", "రైతు బంధు", "రైతు భరోసా"
    ],
    "ignoaps": [
        "ignoaps", "indira gandhi national old age pension", "indira gandhi pension",
        "national old age pension", "కేంద్ర వృద్ధాప్య పింఛను", "ఇందిరా గాంధీ పింఛను"
    ],
    "ntr-bharosa-oap": [
        "ntr bharosa", "ntr pension", "ntr oap", "ntr bharosa oap",
        "ఎన్టీఆర్ భరోసా", "ఎన్టీఆర్ పింఛను", "ఆంధ్రప్రదేశ్ పింఛను", "ఏపీ వృద్ధాప్య పింఛను"
    ],
    "pm-jay": [
        "pm-jay", "pm jay", "pmjay", "ayushman bharat", "ayushman card", "ayushman", "jan arogya",
        "ఆయుష్మాన్ భారత్", "ఆయుష్మాన్ కార్డు", "ఆయుష్మాన్", "జన్ ఆరోగ్య", "ఆరోగ్య శ్రీ"
    ],
    "pmay-g": [
        "pmay-g", "pmay g", "pmay", "pmay gramin", "awaas yojana", "pm awaas", "pradhan mantri awas",
        "ఆవాస్ యోజన", "ప్రధాన మంత్రి ఆవాస్", "ఇందిరమ్మ ఇల్లు", "గ్రామీణ గృహ నిర్మాణం"
    ],
    "ssy": [
        "ssy", "sukanya samriddhi yojana", "sukanya samriddhi", "sukanya",
        "సుకున్య సమృద్ధి", "సుకున్య", "ఆడపిల్లల పథకం", "బాలిక సమృద్ధి"
    ],
    "post-matric-sc": [
        "post-matric-sc", "post matric scholarship", "post matric sc", "sc scholarship", "post matric",
        "పోస్ట్ మెట్రిక్", "ఎస్సీ స్కాలర్‌షిప్", "ఎస్సీ విద్యార్థి వేతనం", "పోస్ట్ మెట్రిక్ స్కాలర్‌షిప్"
    ],
    "talliki-vandanam": [
        "talliki vandanam", "thalliki vandanam", "amma vodi", "ammavodi",
        "తల్లికి వందనం", "అమ్మ ఒడి", "అమ్మఒడి", "బడి పిల్లల పథకం"
    ],
    "annadata-sukhibhava": [
        "annadata sukhibhava", "annadata", "sukhibhava",
        "అన్నదాత సుఖీభవ", "అన్నదాత", "సుఖీభవ", "రైతు పెట్టుబడి సహాయం"
    ],
    "deepam-2": [
        "deepam", "deepam 2", "deepam 2.0", "free gas", "free cylinder", "cooking gas",
        "దీపం", "దీపం 2", "దీపం 2.0", "ఉచిత గ్యాస్", "ఉచిత సిలిండర్", "వంట గ్యాస్"
    ],
    "maha-shakti-free-bus": [
        "maha shakti", "mahashakti", "free bus", "free travel for women", "women free bus", "apsrtc free bus",
        "మహాశక్తి", "మహా శక్తి", "ఉచిత బస్సు", "మహిళల ఉచిత బస్సు", "ఆర్టీసీ ఉచిత ప్రయాణం"
    ],
    "aadabidda-nidhi": [
        "aadabidda nidhi", "adabidda nidhi", "aadabidda", "women 1500",
        "ఆడబిడ్డ నిధి", "ఆడబిడ్డ", "మహిళల 1500", "మహిళా ఆర్థిక సహాయం"
    ],
    "yuvagalam": [
        "yuvagalam", "yuva galam", "unemployment allowance", "unemployed youth", "nirudyoga bhruthi",
        "యువగళం", "యువ గళం", "నిరుద్యోగ భృతి", "నిరుద్యోగ భృతి పథకం"
    ],
    "vidya-deevena": [
        "vidya deevena", "vasathi deevena", "fee reimbursement", "college fee", "jnanabhumi",
        "విద్యా దీవెన", "వసతి దీవెన", "పూర్తి ఫీజు రీయింబర్స్‌మెంట్", "ఫీజు రీయింబర్స్", "జ్ఞానభూమి"
    ]
}

GENERIC_PENSION_KEYWORDS = [
    "old age pension", "oap", "వృద్ధాప్య పెన్షన్", "వృద్ధాప్య పింఛను", "వృద్ధాప్య పింఛన్",
    "pension", "పెన్షన్", "పింఛను", "పింఛన్"
]

TOPIC_PATTERNS = [
    (
        "documents",
        [
            r'\bdocuments?\b', r'\bpapers?\b', r'\bcertificates?\b', r'\bchecklist\b',
            r'కావలసిన\s*పత్రాలు', r'పత్రాలు', r'డాక్యుమెంట్లు', r'సర్టిఫికెట్లు'
        ]
    ),
    (
        "apply",
        [
            r'\bhow\s+(?:do\s+i\s+|can\s+i\s+|to\s+)?apply\b', r'\bapply\b', r'\bapplication\b',
            r'\bprocedure\b', r'\bprocess\b', r'\bregister\b', r'\bregistration\b', r'\bsteps\b',
            r'ఎలా\s*దరఖాస్తు', r'దరఖాస్తు\s*విధానం', r'ఎలా\s*అప్లై', r'దరఖాస్తు', r'నమోదు'
        ]
    ),
    (
        "eligibility",
        [
            r'\beligib(?:le|ility)\b', r'\bcriteria\b', r'\bwho\s+can\b', r'\bage\s+limit\b',
            r'\bqualif(?:y|ication)\b', r'\bconditions?\b', r'\brules?\b',
            r'అర్హత(?:లు)?', r'వయో\s*పరిమితి', r'ఎవరికి\s*వస్తుంది', r'ఎవరు\s*అర్హులు',
            r'నాకు\s*వస్తుందా', r'నిబంధనలు'
        ]
    ),
    (
        "benefits",
        [
            r'\bbenefits?\b', r'\bamount\b', r'\bmoney\b', r'\bhow\s+much\b',
            r'\bfinancial\s+assistance\b', r'\binstalments?\b',
            r'ప్రయోజనాలు', r'లాభాలు', r'డబ్బులు', r'ఎంత\s*మొత్తం', r'రూపాయలు', r'సహాయం'
        ]
    ),
    (
        "overview",
        [
            r'\bwhat\s+is\b', r'\btell\s+me\s+about\b', r'\bdetails?\b', r'\binformation\b',
            r'\babout\b', r'\bsummary\b',
            r'వివరాలు', r'గురించి\s*చెప్పండి', r'సమాచారం', r'ఏమిటి'
        ]
    )
]

def _contains_phrase(text: str, phrase: str) -> bool:
    """Check if phrase exists in text with flexible boundary for English & Telugu."""
    lower_text = text.lower()
    lower_phrase = phrase.lower()

    if lower_phrase in lower_text:
        # Check that it's not a partial English substring like 'pm' in 'equipment'
        # For Telugu, substring match is natural; for English, check word boundary
        if lower_phrase.isascii():
            pattern = r'(?:\b|^)' + re.escape(lower_phrase) + r'(?:\b|$)'
            return bool(re.search(pattern, lower_text))
        return True
    return False

def match_scheme(text: str) -> Tuple[Optional[str], List[str]]:
    """
    Match scheme aliases.
    Returns (matched_scheme_id, choices_if_ambiguous).
    If generic pension matches and no specific scheme matches,
    returns (None, ['ignoaps', 'ntr-bharosa-oap']).
    """
    # 1. Check specific scheme aliases first
    for scheme_id, aliases in SCHEME_ALIASES.items():
        for alias in aliases:
            if _contains_phrase(text, alias):
                return scheme_id, []

    # 2. Check generic pension keywords
    for kw in GENERIC_PENSION_KEYWORDS:
        if _contains_phrase(text, kw):
            return None, ["ignoaps", "ntr-bharosa-oap"]

    return None, []

def detect_topic(text: str) -> Optional[str]:
    """Detect topic in prioritized sequence."""
    lower = text.lower()
    for topic, patterns in TOPIC_PATTERNS:
        for p in patterns:
            if re.search(p, lower):
                return topic
    return None

OUT_OF_SCOPE_PATTERNS = [
    r'\b(?:driving\s+license|commercial\s+license|two[- ]wheeler\s+license|డ్రైవింగ్\s*లైసెన్స్)\b',
    r'\b(?:tatkaal|tatkal|passport\s+renewal|passport\s+fees?|పాస్‌పోర్ట్|పాస్ పోర్ట్)\b',
    r'\b(?:mutual\s+funds?|stocks?|shares?\s+market|crypto|స్టాక్\s*మార్కెట్|షేర్లు)\b',
    r'\b(?:divorce\s+(?:petition|complaint|case)|high\s+court|criminal\s+court|విడాకులు|విడాకుల)\b'
]

def is_out_of_scope(text: str) -> bool:
    """Identify queries clearly outside rural welfare schemes (driving license, passport, stocks, court litigation)."""
    lower = text.lower()
    for pat in OUT_OF_SCOPE_PATTERNS:
        if re.search(pat, lower):
            return True
    return False

