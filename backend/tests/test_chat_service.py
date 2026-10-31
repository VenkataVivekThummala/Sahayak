"""Test suite for ChatService, RAG retrieval, and faithfulness guard."""
import pytest
from backend.app.rag.chat_service import ChatService
from backend.app.rag.guard import verify_faithfulness
from backend.app.rag.retriever import get_retriever

@pytest.fixture
def chat_service():
    return ChatService()

def test_documents_in_en_and_te(chat_service):
    # English
    resp_en = chat_service.handle_message("What documents are required for PM Kisan?", language="en")
    assert resp_en["intent"] == "documents"
    assert resp_en["scheme_id"] == "pm-kisan"
    assert "Aadhaar Card" in resp_en["answer"]
    assert "Required" in resp_en["answer"]
    assert len(resp_en["sources"]) > 0

    # Telugu
    resp_te = chat_service.handle_message("పీఎం కిసాన్ పథకానికి ఏయే పత్రాలు కావాలి?", language="te")
    assert resp_te["intent"] == "documents"
    assert resp_te["scheme_id"] == "pm-kisan"
    assert "ఆధార్ కార్డు" in resp_te["answer"]
    assert "తప్పనిసరి" in resp_te["answer"]

def test_amount_comes_from_data_ntr_bharosa(chat_service):
    resp = chat_service.handle_message("What is the benefit amount for NTR Bharosa pension?", language="en")
    assert resp["intent"] == "benefits"
    assert resp["scheme_id"] == "ntr-bharosa-oap"
    assert "4,000" in resp["answer"]

def test_ambiguous_pension_returns_choices(chat_service):
    resp = chat_service.handle_message("Am I eligible for old age pension?", language="en")
    assert resp["intent"] == "clarify"
    assert resp["choices"] is not None
    choice_ids = [c["scheme_id"] for c in resp["choices"]]
    assert "ignoaps" in choice_ids and "ntr-bharosa-oap" in choice_ids

def test_full_eligibility_dialogue(chat_service):
    # 1. Start dialogue with IGNOAPS
    r1 = chat_service.handle_message("Check eligibility for IGNOAPS", language="en")
    assert r1["intent"] == "eligibility_question"
    assert r1["next_question"] is not None
    assert r1["session"]["pending_field"] == "age"

    # 2. Answer age: 65
    sess1 = r1["session"]
    r2 = chat_service.handle_message("65", language="en", session=sess1)
    assert r2["intent"] == "eligibility_question"
    assert r2["next_question"]["field"] == "is_bpl"
    assert r2["session"]["pending_field"] == "is_bpl"

    # 3. Answer BPL: yes
    sess2 = r2["session"]
    r3 = chat_service.handle_message("yes", language="en", session=sess2)
    assert r3["intent"] == "eligibility_result"
    assert r3["eligibility"]["status"] == "eligible"
    assert "appear to be eligible" in r3["answer"]

def test_reask_on_unparseable_answer(chat_service):
    sess = {
        "active_scheme_id": "ignoaps",
        "pending_field": "is_bpl",
        "facts": {"age": 65}
    }
    # User provides gibberish
    resp = chat_service.handle_message("banana tree", language="en", session=sess)
    assert resp["intent"] == "eligibility_question"
    assert "Please answer with Yes or No" in resp["answer"]
    assert resp["session"]["pending_field"] == "is_bpl"

def test_out_of_scope_questions_refused(chat_service):
    # English out of scope
    resp_en = chat_service.handle_message("How do I renew my two-wheeler commercial driving license?", language="en")
    assert resp_en["intent"] == "no_answer"
    assert resp_en["confidence"] == "none"
    assert "could not find verified official information" in resp_en["answer"]

    # Telugu out of scope
    resp_te = chat_service.handle_message("స్టాక్ మార్కెట్లో ఏ షేర్లు కొంటే మంచి లాభాలు వస్తాయి?", language="te")
    assert resp_te["intent"] == "no_answer"
    assert resp_te["confidence"] == "none"
    assert "ధృవీకరించిన సమాచారం దొరకలేదు" in resp_te["answer"]

def test_empty_message_friendly(chat_service):
    resp = chat_service.handle_message("", language="en")
    assert resp["intent"] == "empty"
    assert "Please ask your question" in resp["answer"]

def test_guard_blocks_invented_numbers_and_urls():
    context = "PM Kisan provides Rs 6,000 per year directly to bank accounts."
    user_q = "How much is PM Kisan?"

    # Valid grounded answer
    assert verify_faithfulness("You receive Rs 6,000 per year.", context, user_q) is True

    # Hallucinated number 10,000
    assert verify_faithfulness("You receive Rs 10,000 per year.", context, user_q) is False

    # Hallucinated URL
    assert verify_faithfulness("Check details at https://fake-scheme-portal.com", context, user_q) is False

def test_automatic_fact_absorption(chat_service):
    resp = chat_service.handle_message("I am 65 years old and my income is 80,000", language="en")
    assert resp["session"]["facts"].get("age") == 65
    assert resp["session"]["facts"].get("annual_income") == 80000
