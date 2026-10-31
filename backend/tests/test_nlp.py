"""Test suite for NLP extractor and intent classification."""
import pytest
from backend.app.nlp.extract import (
    normalize_digits, detect_language, extract_number, extract_age,
    extract_income, extract_yes_no
)
from backend.app.nlp.intent import match_scheme, detect_topic

def test_telugu_digits_normalization():
    assert normalize_digits("౧౨౩౪") == "1234"
    assert normalize_digits("వయస్సు ౬౫") == "వయస్సు 65"
    assert normalize_digits("5000") == "5000"

def test_language_detection():
    assert detect_language("Hello what is PM Kisan?") == "en"
    assert detect_language("పీఎం కిసాన్ వివరాలు చెప్పండి") == "te"
    assert detect_language("PM Kisan పథకం") == "te"

def test_extract_age_english():
    assert extract_age("I am 65 years old") == 65
    assert extract_age("My age is 72") == 72
    assert extract_age("age 60") == 60
    assert extract_age("70 yrs") == 70
    assert extract_age("65") == 65

def test_extract_age_telugu():
    assert extract_age("వయస్సు 65") == 65
    assert extract_age("70 సంవత్సరాలు") == 70
    assert extract_age("నా వయసు 60") == 60
    assert extract_age("౬౫ ఏళ్లు") == 65

def test_extract_income_english():
    assert extract_income("My annual income is 80,000") == 80000
    assert extract_income("income 1.5 lakh") == 150000
    assert extract_income("Rs 2 lakhs") == 200000
    assert extract_income("salary 50000") == 50000

def test_extract_income_telugu():
    assert extract_income("వార్షిక ఆదాయం 1,50,000") == 150000
    assert extract_income("ఆదాయం 2 లక్షలు") == 200000
    assert extract_income("రూ. 80000 సంపాదన") == 80000

def test_no_false_income_from_age():
    # Crucial rule: age must NEVER be parsed as income
    assert extract_income("I am 65 years old") is None
    assert extract_income("వయస్సు 70 సంవత్సరాలు") is None
    assert extract_income("నాకు 60 ఏళ్లు ఉన్నాయి") is None

def test_extract_yes_no_both_languages():
    # English
    assert extract_yes_no("yes") is True
    assert extract_yes_no("yeah I do") is True
    assert extract_yes_no("no") is False
    assert extract_yes_no("nope") is False

    # Telugu
    assert extract_yes_no("అవును") is True
    assert extract_yes_no("ఉంది") is True
    assert extract_yes_no("అవునండి") is True
    assert extract_yes_no("కాదు") is False
    assert extract_yes_no("లేదు") is False
    assert extract_yes_no("లేదండి") is False

    # Ambiguous
    assert extract_yes_no("maybe perhaps") is None
    assert extract_yes_no("something else") is None

def test_scheme_matching_specific():
    s_id, choices = match_scheme("What is PM Kisan?")
    assert s_id == "pm-kisan"
    assert choices == []

    s_id, choices = match_scheme("ఆయుష్మాన్ భారత్ కార్డు ఎలా పొందాలి?")
    assert s_id == "pm-jay"

    s_id, choices = match_scheme("Tell me about Sukanya Samriddhi Yojana")
    assert s_id == "ssy"

    s_id, choices = match_scheme("ఎన్టీఆర్ భరోసా పింఛను వివరాలు")
    assert s_id == "ntr-bharosa-oap"

    s_id, choices = match_scheme("తల్లికి వందనం పథకం లేదా అమ్మ ఒడి వివరాలు")
    assert s_id == "talliki-vandanam"

    s_id, choices = match_scheme("Tell me about Deepam 2.0 free gas cylinder")
    assert s_id == "deepam-2"

    s_id, choices = match_scheme("మహాశక్తి ఉచిత బస్సు ప్రయాణం ఎలా పొందాలి?")
    assert s_id == "maha-shakti-free-bus"

    s_id, choices = match_scheme("Annadata Sukhibhava farmer support")
    assert s_id == "annadata-sukhibhava"

    s_id, choices = match_scheme("ఆడబిడ్డ నిధి పథకం")
    assert s_id == "aadabidda-nidhi"

    s_id, choices = match_scheme("Yuvagalam youth unemployment allowance")
    assert s_id == "yuvagalam"

    s_id, choices = match_scheme("విద్యా దీవెన కాలేజీ ఫీజు రీయింబర్స్")
    assert s_id == "vidya-deevena"

def test_generic_pension_returns_choices():
    # Generic pension with no specific scheme mentioned must return choices
    s_id, choices = match_scheme("Can I get an old age pension?")
    assert s_id is None
    assert "ignoaps" in choices and "ntr-bharosa-oap" in choices

    s_id, choices = match_scheme("నాకు వృద్ధాప్య పెన్షన్ వస్తుందా?")
    assert s_id is None
    assert "ignoaps" in choices and "ntr-bharosa-oap" in choices

def test_topic_priority():
    assert detect_topic("What documents are required?") == "documents"
    assert detect_topic("కావలసిన పత్రాలు ఏమిటి?") == "documents"
    assert detect_topic("How to apply online?") == "apply"
    assert detect_topic("దరఖాస్తు విధానం ఏమిటి?") == "apply"
    assert detect_topic("What is the eligibility criteria and age limit?") == "eligibility"
    assert detect_topic("ఎవరు అర్హులు?") == "eligibility"
    assert detect_topic("How much money or benefits will I receive?") == "benefits"
    assert detect_topic("రూపాయలు ఎంత సాయం అందుతుంది?") == "benefits"
    assert detect_topic("Tell me details about this scheme") == "overview"
