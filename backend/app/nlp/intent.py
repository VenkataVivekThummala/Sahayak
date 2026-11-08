"""Intent recognition, scheme alias matching, and topic detection."""
import re
from typing import Optional, List, Dict, Tuple, Any

SCHEME_ALIASES: Dict[str, List[str]] = {
    "pm-kisan": [
        "pm kisan", "pm-kisan", "pmkisan", "kisan samman nidhi", "kisan nidhi",
        "raithu pathakalu", "raithu pathakam", "kisan pathakam", "raithu sahayam",
        "raithu bandhu", "raithu bharosa", "6000 raithu", "raithu 6000",
        "పీఎం కిసాన్", "పిఎం కిసాన్", "రైతు సమ్మాన్ నిధి", "రైతు బంధు", "రైతు భరోసా",
        "రైతు సాయం", "రైతులకు 6000", "రైతు డబ్బులు", "మోదీ డబ్బులు", "కిసాన్ సాయం", "రైతులకు ఆరు వేలు"
    ],
    "ignoaps": [
        "ignoaps", "indira gandhi national old age pension", "indira gandhi pension",
        "national old age pension", "central old age pension", "central pension",
        "కేంద్ర వృద్ధాప్య పింఛను", "ఇందిరా గాంధీ పింఛను"
    ],
    "ntr-bharosa-oap": [
        "ntr bharosa", "ntr pension", "ntr oap", "ntr bharosa oap",
        "ap old age pension", "andhra pension", "vruddhapya pension", "vruddhapya scheme",
        "old age scheme", "4000 pension", "ntr 4000",
        "ఎన్టీఆర్ భరోసా", "ఎన్టీఆర్ పింఛను", "ఆంధ్రప్రదేశ్ పింఛను", "ఏపీ వృద్ధాప్య పింఛను",
        "ముసలి వాళ్ళ పెన్షన్", "వృద్ధుల పెన్షన్", "నాలుగు వేల పెన్షన్", "చంద్రన్న పెన్షన్", "4000 పెన్షన్"
    ],
    "pm-jay": [
        "pm-jay", "pm jay", "pmjay", "ayushman bharat", "ayushman card", "ayushman", "jan arogya",
        "arogyasri", "arogya sri", "arogya pathakam", "arogya scheme", "health card",
        "hospital scheme", "vaidyam", "chikitsa scheme", "5 lakh health", "free hospital",
        "ఆయుష్మాన్ భారత్", "ఆయుష్మాన్ కార్డు", "ఆయుష్మాన్", "జన్ ఆరోగ్య", "ఆరోగ్య శ్రీ",
        "ఆరోగ్యశ్రీ కార్డు", "హాస్పిటల్ కార్డు", "5 లక్షల కార్డు", "వైద్య సాయం"
    ],
    "pmay-g": [
        "pmay-g", "pmay g", "pmay", "pmay gramin", "awaas yojana", "pm awaas", "pradhan mantri awas",
        "illu kavali", "illu pathakam", "intlu", "house scheme", "gramin housing", "rural housing",
        "free house", "pucca house", "new house scheme",
        "ఆవాస్ యోజన", "ప్రధాన మంత్రి ఆవాస్", "ఇందిరమ్మ ఇల్లు", "గ్రామీణ గృహ నిర్మాణం",
        "ఇళ్ల స్థలాలు", "ఇళ్ల పథకం", "ఇల్లు కట్టుకోవడానికి", "పేదల ఇళ్లు", "ప్రభుత్వ ఇల్లు"
    ],
    "ssy": [
        "ssy", "sukanya samriddhi yojana", "sukanya samriddhi", "sukanya",
        "girl child scheme", "adabidda pathakam", "daughter scheme", "girl scheme",
        "సుకున్య సమృద్ధి", "సుకున్య", "ఆడపిల్లల పథకం", "బాలిక సమృద్ధి", "పోస్టాఫీస్ ఆడపిల్లల పథకం"
    ],
    "post-matric-sc": [
        "post-matric-sc", "post matric scholarship", "post matric sc", "sc scholarship", "post matric",
        "sc st scholarship", "bc scholarship", "dalit scholarship",
        "పోస్ట్ మెట్రిక్", "ఎస్సీ స్కాలర్‌షిప్", "ఎస్సీ విద్యార్థి వేతనం", "పోస్ట్ మెట్రిక్ స్కాలర్‌షిప్"
    ],
    "talliki-vandanam": [
        "talliki vandanam", "thalliki vandanam", "amma vodi", "ammavodi",
        "badi pillalu", "school scholarship", "school scheme", "mother scheme", "15000 school",
        "తల్లికి వందనం", "అమ్మ ఒడి", "అమ్మఒడి", "బడి పిల్లల పథకం", "బడి పిల్లల డబ్బులు", "15000 పథకం"
    ],
    "annadata-sukhibhava": [
        "annadata sukhibhava", "annadata", "sukhibhava",
        "రైతు పెట్టుబడి సహాయం",
        "అన్నదాత సుఖీభవ", "అన్నదాత", "సుఖీభవ"
    ],
    "deepam-2": [
        "deepam", "deepam 2", "deepam 2.0", "free gas", "free cylinder", "cooking gas",
        "gas cylinder free", "lpg free", "gas scheme", "deepam pathakam", "free lpg",
        "దీపం", "దీపం 2", "దీపం 2.0", "ఉచిత గ్యాస్", "ఉచిత సిలిండర్", "వంట గ్యాస్",
        "ఫ్రీ గ్యాస్", "ఉచిత గ్యాస్ పథకం", "దీపం పథకం", "గ్యాస్ సబ్సిడీ", "3 సిలిండర్లు"
    ],
    "maha-shakti-free-bus": [
        "maha shakti", "mahashakti", "free bus", "free travel for women", "women free bus", "apsrtc free bus",
        "bus pass women", "free apsrtc", "women bus pass",
        "మహాశక్తి", "మహా శక్తి", "ఉచిత బస్సు", "మహిళల ఉచిత బస్సు", "ఆర్టీసీ ఉచిత ప్రయాణం",
        "ఫ్రీ బస్సు", "మహిళలకు ఫ్రీ బస్సు", "ఆర్టీసీ ఉచిత బస్సు", "ఆర్టీసీ ఫ్రీ బస్సు"
    ],
    "aadabidda-nidhi": [
        "aadabidda nidhi", "adabidda nidhi", "aadabidda", "women 1500",
        "1500 women", "monthly 1500", "women monthly allowance",
        "ఆడబిడ్డ నిధి", "ఆడబిడ్డ", "మహిళల 1500", "మహిళా ఆర్థిక సహాయం",
        "నెలకు 1500", "ఆడబిడ్డ డబ్బులు"
    ],
    "yuvagalam": [
        "yuvagalam", "yuva galam", "unemployment allowance", "unemployed youth", "nirudyoga bhruthi",
        "youth allowance", "job allowance", "3000 youth", "yuva allowance",
        "యువగళం", "యువ గళం", "నిరుద్యోగ భృతి", "నిరుద్యోగ భృతి పథకం", "3000 భృతి", "నిరుద్యోగులకు సాయం"
    ],
    "vidya-deevena": [
        "vidya deevena", "vasathi deevena", "fee reimbursement", "college fee", "jnanabhumi",
        "vidya pathakam", "fee pathakam", "college scholarship", "vidya scholarship",
        "విద్యా దీవెన", "వసతి దీవెన", "పూర్తి ఫీజు రీయింబర్స్‌మెంట్", "ఫీజు రీయింబర్స్", "జ్ఞానభూమి"
    ]
}

GENERIC_PENSION_KEYWORDS = [
    "old age pension", "oap", "వృద్ధాప్య పెన్షన్", "వృద్ధాప్య పింఛను", "వృద్ధాప్య పింఛన్",
    "pension", "pensions", "pension scheme", "government pension", "pension schemes",
    "what pensions", "available pensions", "which pension", "type of pension", "types of pension",
    "పెన్షన్", "పింఛను", "పింఛన్", "పింఛనులు", "పింఛన్లు", "పెన్షన్లు",
    "penchan", "penchanu", "penchalu", "penchulu"
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

GREETING_WORDS = [
    "hi", "hello", "hey", "namaste", "namaskaram", "good morning", "good afternoon", "good evening",
    "help", "who are you", "what can you do",
    "నమస్కారం", "నమస్తే", "హలో", "హాయ్", "బాబు", "నమస్కారమండి", "సహాయం కావాలి", "హెల్ప్ కావాలి",
    "ఎలా ఉన్నారు", "పథకాలు చూపించు", "పథకాలు ఏమున్నాయి"
]

def is_greeting(text: str) -> bool:
    """Detect general greetings or requests for introductory guidance."""
    lower = text.strip().lower()
    for w in GREETING_WORDS:
        if _contains_phrase(lower, w):
            return True
    return False

CATEGORY_QUERIES = [
    ("agriculture", [
        "farmer", "farmers", "agriculture", "cultivation", "crop", "kisan",
        "రైతు", "రైతులు", "రైతులకు", "వ్యవసాయం", "పంట", "సాగు", "రైతు పథకాలు"
    ], ["pm-kisan", "annadata-sukhibhava"]),
    ("women_family", [
        "women", "woman", "ladies", "girls", "female", "mother",
        "మహిళలు", "మహిళా", "ఆడవారు", "ఆడవాళ్ళకి", "స్త్రీలు", "మహిళల పథకాలు", "ఆడపిల్లల"
    ], ["deepam-2", "maha-shakti-free-bus", "aadabidda-nidhi", "ssy"]),
    ("health", [
        "health", "hospital", "medical", "treatment", "doctor", "illness",
        "ఆరోగ్యం", "హాస్పిటల్", "వైద్యం", "మందులు", "చికిత్స", "ఆపరేషన్", "ఆరోగ్య పథకం"
    ], ["pm-jay"]),
    ("housing", [
        "house", "housing", "home", "shelter",
        "ఇల్లు", "ఇళ్లు", "ఇళ్ల స్థలాలు", "ఇళ్ల పథకం", "గృహం", "గృహ నిర్మాణం", "ఇంటి పథకం"
    ], ["pmay-g"]),
    ("education", [
        "student", "students", "education", "school", "college", "scholarship", "study",
        "విద్యార్థులు", "చదువు", "కాలేజీ", "స్కూల్", "ఫీజు", "స్కాలర్‌షిప్", "విద్యా పథకాలు"
    ], ["talliki-vandanam", "vidya-deevena", "post-matric-sc"]),
    ("social_welfare", [
        "youth", "unemployed", "unemployment", "job", "allowance",
        "యువత", "నిరుద్యోగం", "నిరుద్యోగులు", "ఉద్యోగం", "నిరుద్యోగ భృతి"
    ], ["yuvagalam"])
]

def match_category_query(text: str) -> Optional[Tuple[str, List[str]]]:
    """Detect if user is asking for a category of schemes rather than a specific scheme."""
    lower = text.strip().lower()
    for cat_name, keywords, schemes in CATEGORY_QUERIES:
        for kw in keywords:
            if _contains_phrase(lower, kw):
                return cat_name, schemes
    return None


# ─── Tanglish / Romanized-Telugu Preprocessor ───────────────────────────────
# Maps common Romanized Telugu (Tanglish) words to English equivalents so that
# the alias matcher and TF-IDF retriever understand them correctly.
TANGLISH_MAP: Dict[str, str] = {
    # Agriculture / Farming
    "raithu":       "farmer kisan",
    "raitu":        "farmer kisan",
    "raitulu":      "farmers kisan",
    "pathakam":     "scheme yojana",
    "pathakalu":    "schemes yojanas",
    "pathkam":      "scheme yojana",
    "sahayam":      "assistance help welfare",
    "samman":       "honor respect nidhi",
    "nidhi":        "fund money samman",
    "annadata":     "farmer annadata kisan",
    "panta":        "crop agriculture",
    "pantalu":      "crops agriculture",
    "vyavasayam":   "agriculture farming",
    # Health
    "arogyasri":    "ayushman health arogya sri insurance",
    "arogya":       "health ayushman insurance",
    "vaidyam":      "medical health treatment hospital",
    "chikitsa":     "medical health hospital treatment",
    "asupathri":    "hospital treatment",
    "velluvaru":    "hospital doctor",
    # Housing
    "illu":         "house housing home",
    "intlu":        "houses housing homes",
    "gruham":       "house housing home",
    "gruhalu":      "houses housing homes",
    "illu kavali":  "house scheme housing",
    "intlu kavali": "houses scheme housing",
    # Pension
    "penchan":      "pension old age",
    "penchanu":     "pension old age",
    "penchalu":     "pensions old age",
    "penchulu":     "pensions old age",
    "bharosa":      "ntr bharosa pension trust",
    "pinchan":      "pension",
    "pinchanu":     "pension old age",
    "pinchalu":     "pensions",
    # Education
    "vidya":        "education scholarship fee",
    "pillalu":      "children students school",
    "badi":         "school education",
    "challu":       "college education",
    "chaluvulu":    "studies education",
    "phee":         "fee fees college",
    "scholarship":  "scholarship education fee",
    # Gas / Energy
    "deepam":       "deepam gas cylinder free cooking",
    "gas":          "gas cylinder cooking lpg deepam",
    "cylinder":     "cylinder gas lpg",
    "vantagas":     "cooking gas cylinder",
    # Women / Family
    "mahila":       "women female ladies welfare",
    "mahilalu":     "women female ladies welfare",
    "ammodi":       "mother mother scheme ammavodi",
    "talliki":      "mother talliki vandanam",
    "adabidda":     "daughter girl women aadabidda",
    # Transport
    "bus":          "bus apsrtc free travel",
    "basu":         "bus apsrtc free travel",
    # Youth / Employment
    "yuva":         "youth young unemployed yuvagalam",
    "nirudyoga":    "unemployment unemployed allowance",
    "udyogam":      "employment job work",
    # General welfare
    "pathakam":     "scheme yojana welfare",
    "sarkar":       "government welfare scheme",
    "prabhutvam":   "government welfare scheme",
    "laddu":        "benefit amount money",
    "sontam":       "own personal",
    "kavali":       "need want required",
}


def preprocess_tanglish(text: str) -> str:
    """
    Expand Romanized Telugu (Tanglish) words in the query to English equivalents.
    This improves both alias matching and TF-IDF retrieval for rural users who
    type Telugu phonetically in the Latin script.

    Returns the original text plus appended expansion terms (preserves original
    so it still matches Telugu-script aliases too).
    """
    lower = text.lower()
    expansions: List[str] = []
    for tanglish_word, english_equiv in TANGLISH_MAP.items():
        # Use word-boundary-aware matching for multi-word phrases
        if " " in tanglish_word:
            if tanglish_word in lower:
                expansions.append(english_equiv)
        else:
            pattern = r'(?<![a-z])' + re.escape(tanglish_word) + r'(?![a-z])'
            if re.search(pattern, lower):
                expansions.append(english_equiv)
    if expansions:
        return text + " " + " ".join(expansions)
    return text

