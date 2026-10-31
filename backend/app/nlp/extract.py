"""Extraction module for Telugu/English digits, numbers, age, income, and yes/no."""
import re
from typing import Optional, Tuple, Any

TELUGU_DIGIT_MAP = {
    '౦': '0', '౧': '1', '౨': '2', '౩': '3', '౪': '4',
    '౫': '5', '౬': '6', '౭': '7', '౮': '8', '౯': '9'
}

def normalize_digits(text: str) -> str:
    """Convert Telugu Unicode digits (౦-౯) to standard ASCII digits (0-9)."""
    if not text:
        return ""
    result = []
    for ch in text:
        result.append(TELUGU_DIGIT_MAP.get(ch, ch))
    return "".join(result)

def detect_language(text: str) -> str:
    """Detect whether text contains Telugu script."""
    if not text:
        return "en"
    for ch in text:
        if '\u0C00' <= ch <= '\u0C7F':
            return "te"
    return "en"

def _parse_multiplier(text: str) -> Tuple[float, str]:
    """Parse Indian multiplier words (lakh, crore) into numeric values."""
    lower = text.lower()
    # Match lakh / లక్ష
    lakh_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|లక్ష|లక్షలు)', lower)
    if lakh_match:
        val = float(lakh_match.group(1)) * 100000
        return val, "lakh"

    # Match crore / కోటి
    crore_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:crore|crores|కోటి|కోట్లు)', lower)
    if crore_match:
        val = float(crore_match.group(1)) * 10000000
        return val, "crore"

    # Match standard number with optional commas
    num_match = re.search(r'(\d[\d,]*(?:\.\d+)?)', lower)
    if num_match:
        clean_num = num_match.group(1).replace(',', '')
        try:
            return float(clean_num), "raw"
        except ValueError:
            return 0.0, "none"

    return 0.0, "none"

def extract_number(text: str) -> Optional[float]:
    """Extract a bare number, including lakh/crore multipliers and Telugu digits."""
    norm = normalize_digits(text).strip()
    val, kind = _parse_multiplier(norm)
    if kind != "none":
        return int(val) if val.is_integer() else val
    return None

def extract_age(text: str) -> Optional[int]:
    """
    Extract age from text (range 0 to 120).
    Understands: "I am 65 years old", "age 65", "వయస్సు 65", "70 సంవత్సరాలు", "నా వయసు 60".
    """
    norm = normalize_digits(text).lower()

    # Pattern with explicit age keywords in EN and TE
    patterns = [
        r'\b(?:age|aged)\b\s*(?:is\s*)?(\d{1,3})',
        r'(\d{1,3})\s*(?:years\s*old|years|yr|yrs)\b',
        r'(?:వయస్సు|వయసు)\s*(?:సుమారు\s*)?(\d{1,3})',
        r'(\d{1,3})\s*(?:సంవత్సరాలు|సంవత్సరాల|ఏళ్లు|ఏళ్ల)',
        r'నా\s*వయసు\s*(\d{1,3})'
    ]

    for p in patterns:
        m = re.search(p, norm)
        if m:
            val = int(m.group(1))
            if 0 <= val <= 120:
                return val

    # Bare number match if the entire input is just an age answer
    bare_match = re.fullmatch(r'\s*(\d{1,3})\s*', norm)
    if bare_match:
        val = int(bare_match.group(1))
        if 0 <= val <= 120:
            return val

    return None

def extract_income(text: str) -> Optional[float]:
    """
    Extract income ONLY when income is explicitly indicated.
    Never reads an age as an income.
    Understands: "income 80,000", "1.5 lakh", "ఆదాయం 2 లక్షలు", "Rs 2 lakhs", "వార్షిక ఆదాయం 1,50,000".
    """
    norm = normalize_digits(text).lower()

    # Precise regex patterns requiring income keywords or rupee symbol
    income_patterns = [
        r'\b(?:income|annual\s+income|salary|earnings?)\b[^0-9\n]*(\d+(?:,\d+)*(?:\.\d+)?\s*(?:lakhs?|crores?)?)',
        r'(?:ఆదాయం|వార్షిక\s*ఆదాయం|సంపాదన|జీతం)[^0-9\n]*(\d+(?:,\d+)*(?:\.\d+)?\s*(?:లక్షలు?|కోట్లు?)?)',
        r'(?:rs\.?|inr|rupees|రూ\.?|రూపాయలు)\s*(\d+(?:,\d+)*(?:\.\d+)?\s*(?:lakhs?|crores?|లక్షలు?|కోట్లు?)?)',
        r'(\d+(?:,\d+)*(?:\.\d+)?\s*(?:lakhs?|crores?|లక్షలు?|కోట్లు?))\s*(?:income|ఆదాయం|రూపాయలు|rupees)'
    ]

    for pattern in income_patterns:
        m = re.search(pattern, norm)
        if m:
            num_part = m.group(1)
            val, kind = _parse_multiplier(num_part)
            if kind != "none" and val >= 0:
                return int(val) if val.is_integer() else val

    return None

def extract_yes_no(text: str) -> Optional[bool]:
    """
    Extract binary yes/no decision in English and Telugu.
    Returns:
      True: Yes
      False: No
      None: Ambiguous / unknown
    """
    norm = normalize_digits(text).strip().lower()

    # English positive and negative
    en_yes = {"yes", "yeah", "yep", "y", "true", "correct", "have", "own", "sure"}
    en_no = {"no", "nope", "n", "false", "do not", "don't", "none", "neither"}

    # Telugu positive and negative
    te_yes = {
        "అవును", "ఉంది", "ఉన్నాయి", "అవునండి", "నిజమే", "కలిగి ఉన్నాను", "ఉన్నాం",
        "సరిపోయింది", "అవునుండి"
    }
    te_no = {
        "కాదు", "లేదు", "లేవు", "కాదండి", "లేదండి", "చెల్లించలేదు", "లేము", "కాదుండి"
    }

    words = set(re.findall(r'[\w\u0C00-\u0C7F]+', norm))
    has_yes = bool(words & (en_yes | te_yes))
    has_no = bool(words & (en_no | te_no))

    if has_yes and not has_no:
        return True
    if has_no and not has_yes:
        return False
    return None
