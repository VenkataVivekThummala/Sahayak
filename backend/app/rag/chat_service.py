"""Stateless Chat Service orchestrating NLP, deterministic eligibility, and verified RAG."""
from typing import Dict, Any, List, Optional
from ..knowledge import load_schemes_by_id, load_fields, get_primary_source
from ..config import SIMILARITY_THRESHOLD, get_disclaimer
from ..nlp.extract import (
    detect_language, extract_age, extract_income, extract_number, extract_yes_no
)
from ..nlp.intent import match_scheme, detect_topic, is_out_of_scope, is_greeting, match_category_query, preprocess_tanglish
from ..eligibility.engine import check_eligibility
from .retriever import get_retriever
from .guard import verify_faithfulness
from ..llm.provider import get_llm_provider

class ChatService:
    """Orchestrator for citizen inquiries."""

    def __init__(self):
        self.retriever = get_retriever()
        self.llm = get_llm_provider()

    def handle_message(
        self,
        message: str,
        language: Optional[str] = None,
        session: Optional[Dict[str, Any]] = None,
        scheme_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process incoming chat query with complete order-of-decisions orchestration."""
        raw_msg = (message or "").strip()
        lang = language or detect_language(raw_msg)
        if lang not in ["en", "te"]:
            lang = "en"

        # Expand Tanglish (Romanized Telugu) words so intent matching and RAG retrieval work correctly
        expanded_msg = preprocess_tanglish(raw_msg)

        sess = dict(session) if session else {}
        facts = dict(sess.get("facts", {}))
        pending_field = sess.get("pending_field")
        topic_hint = sess.get("topic_hint")
        active_scheme_id = scheme_id or sess.get("active_scheme_id")

        disclaimer = get_disclaimer(lang)

        # Empty message edge case
        if not raw_msg and not pending_field and not scheme_id:
            empty_text = "దయచేసి మీ ప్రశ్నను అడగండి." if lang == "te" else "Please ask your question."
            return {
                "answer": empty_text,
                "speech_text": empty_text,
                "language": lang,
                "intent": "empty",
                "scheme_id": None,
                "sources": [],
                "confidence": "high",
                "next_question": None,
                "eligibility": None,
                "choices": None,
                "session": sess,
                "disclaimer": disclaimer
            }

        # Greeting / Introductory inquiry
        if is_greeting(expanded_msg) and not pending_field and not scheme_id:
            schemes_dict = load_schemes_by_id()
            suggested_ids = ["pm-kisan", "ntr-bharosa-oap", "deepam-2", "pm-jay", "talliki-vandanam"]
            choice_objs = []
            for cid in suggested_ids:
                s_obj = schemes_dict.get(cid)
                if s_obj:
                    choice_objs.append({
                        "scheme_id": cid,
                        "name": s_obj.get(f"name_{lang}", s_obj.get("name_en", cid))
                    })
            if lang == "te":
                welcome = (
                    "నమస్కారం! నేను మీ ప్రభుత్వ సహాయక్ వాయిస్ అసిస్టెంట్‌ని. "
                    "ఆంధ్రప్రదేశ్ మరియు కేంద్ర ప్రభుత్వ సంక్షేమ పథకాలు, అర్హతలు, కావలసిన పత్రాల గురించి నన్ను అడగండి. "
                    "ఉదాహరణకు: 'రైతు పథకాలు', 'వృద్ధాప్య పింఛను', 'ఉచిత గ్యాస్', 'ఆయుష్మాన్ భారత్' గురించి మాట్లాడండి లేదా కింద ఉన్న పథకాన్ని ఎంచుకోండి:"
                )
                spoken = "నమస్కారం! నేను ప్రభుత్వ సహాయక్ అసిస్టెంట్‌ని. సంక్షేమ పథకాలు మరియు అర్హతల గురించి మాట్లాడండి."
            else:
                welcome = (
                    "Namaste! I am Government Sahayak, your official welfare scheme guide. "
                    "Ask me about AP & Central government schemes, eligibility rules, and required documents. "
                    "You can speak your question or choose a scheme below:"
                )
                spoken = "Namaste! I am Government Sahayak. Ask me about any government welfare scheme."
            return {
                "answer": welcome,
                "speech_text": spoken,
                "language": lang,
                "intent": "greeting",
                "scheme_id": None,
                "sources": [],
                "confidence": "high",
                "next_question": None,
                "eligibility": None,
                "choices": choice_objs,
                "session": sess,
                "disclaimer": disclaimer
            }

        # Category-level question (e.g. "farmer schemes", "women welfare", "housing")
        cat_match = match_category_query(expanded_msg)
        if cat_match and not pending_field and not scheme_id:
            cat_name, cat_scheme_ids = cat_match
            matched_id, _ = match_scheme(expanded_msg)
            if not matched_id:
                schemes_dict = load_schemes_by_id()
                choice_objs = []
                for cid in cat_scheme_ids:
                    s_obj = schemes_dict.get(cid)
                    if s_obj:
                        choice_objs.append({
                            "scheme_id": cid,
                            "name": s_obj.get(f"name_{lang}", s_obj.get("name_en", cid))
                        })
                if choice_objs:
                    if lang == "te":
                        ans = "మీరు అడిగిన రంగానికి సంబంధించిన ముఖ్యమైన ప్రభుత్వ సంక్షేమ పథకాలు ఇవి. పూర్తి వివరాలు లేదా అర్హత తెలుసుకోవడానికి కింద ఉన్న పథకాన్ని ఎంచుకోండి లేదా పేరు మాట్లాడండి:"
                    else:
                        ans = "Here are the official welfare schemes in this category. Tap a scheme or speak its name to check benefits and eligibility:"
                    return {
                        "answer": ans,
                        "speech_text": ans,
                        "language": lang,
                        "intent": "category_schemes",
                        "scheme_id": None,
                        "sources": [],
                        "confidence": "high",
                        "next_question": None,
                        "eligibility": None,
                        "choices": choice_objs,
                        "session": sess,
                        "disclaimer": disclaimer
                    }

        # 0. Automatically absorb any facts mentioned in the message
        age_found = extract_age(raw_msg)
        if age_found is not None:
            facts["age"] = age_found
        inc_found = extract_income(raw_msg)
        if inc_found is not None:
            facts["annual_income"] = inc_found
        sess["facts"] = facts

        # Decision 1: A pending_field in session -> parse answer and continue eligibility
        if pending_field and active_scheme_id:
            fields_def = load_fields()
            f_spec = fields_def.get(pending_field, {})
            f_type = f_spec.get("type", "bool")

            parsed_val = None
            if f_type == "bool":
                parsed_val = extract_yes_no(raw_msg)
            elif f_type == "number":
                parsed_val = extract_number(raw_msg)

            if parsed_val is None:
                # Polite re-ask
                if f_type == "bool":
                    reask = "దయచేసి అవును లేదా కాదు అని సమాధానం ఇవ్వండి." if lang == "te" else "Please answer with Yes or No."
                else:
                    reask = "దయచేసి సరైన సంఖ్యను నమోదు చేయండి." if lang == "te" else "Please enter a valid number."
                next_q = {
                    "field": pending_field,
                    "type": f_type,
                    "text": f_spec.get(lang, f_spec.get("en"))
                }
                return {
                    "answer": f"{reask}\n\n{next_q['text']}",
                    "speech_text": f"{reask} {next_q['text']}",
                    "language": lang,
                    "intent": "eligibility_question",
                    "scheme_id": active_scheme_id,
                    "sources": self._get_scheme_sources(active_scheme_id),
                    "confidence": "high",
                    "next_question": next_q,
                    "eligibility": None,
                    "choices": None,
                    "session": sess,
                    "disclaimer": disclaimer
                }

            # Valid answer received
            facts[pending_field] = parsed_val
            sess["facts"] = facts
            sess["pending_field"] = None

            return self._continue_eligibility(active_scheme_id, facts, lang, sess, disclaimer)

        # Decision 2: Scheme ID given (e.g. user tapped a choice)
        if scheme_id:
            active_scheme_id = scheme_id
            sess["active_scheme_id"] = scheme_id
            topic = topic_hint or detect_topic(raw_msg) or "overview"
            return self._answer_structured_scheme(active_scheme_id, topic, facts, lang, sess, disclaimer)

        # Decision 3: Scheme recognized in query
        matched_id, choices = match_scheme(expanded_msg)
        if choices:
            # Ambiguous scheme match (e.g. "pension") -> show choices
            sess["topic_hint"] = detect_topic(raw_msg) or "overview"
            choice_objs = []
            schemes_dict = load_schemes_by_id()
            for cid in choices:
                s_obj = schemes_dict.get(cid, {})
                choice_objs.append({
                    "scheme_id": cid,
                    "name": s_obj.get(f"name_{lang}", s_obj.get("name_en", cid))
                })
            clarify_text = "మీరు ఏ పథకం గురించి అడుగుతున్నారు?" if lang == "te" else "Which scheme do you mean?"
            return {
                "answer": clarify_text,
                "speech_text": clarify_text,
                "language": lang,
                "intent": "clarify",
                "scheme_id": None,
                "sources": [],
                "confidence": "high",
                "next_question": None,
                "eligibility": None,
                "choices": choice_objs,
                "session": sess,
                "disclaimer": disclaimer
            }

        if matched_id:
            active_scheme_id = matched_id
            sess["active_scheme_id"] = matched_id
            topic = detect_topic(expanded_msg) or "overview"
            return self._answer_structured_scheme(active_scheme_id, topic, facts, lang, sess, disclaimer)

        # Decision 3.5: Reject queries explicitly out of scope for rural welfare schemes
        if is_out_of_scope(expanded_msg):
            no_info_text = (
                "నాకు ధృవీకరించిన సమాచారం దొరకలేదు. దయచేసి అధికారిక వెబ్సైట్ చూడండి లేదా సహాయ కేంద్రాన్ని అడగండి."
                if lang == "te" else
                "I could not find verified official information for this question. Please check the official government portal or contact the help desk."
            )
            return {
                "answer": no_info_text,
                "speech_text": no_info_text,
                "language": lang,
                "intent": "no_answer",
                "scheme_id": None,
                "sources": [],
                "confidence": "none",
                "next_question": None,
                "eligibility": None,
                "choices": None,
                "session": sess,
                "disclaimer": disclaimer
            }

        # Decision 4: Semantic Retrieval (with Tanglish-expanded query for better recall)
        retrieval_results = self.retriever.retrieve(expanded_msg, top_k=1, target_lang=lang)
        if not retrieval_results or retrieval_results[0][1] < SIMILARITY_THRESHOLD:
            # Fallback: offer category choices instead of blunt "no info" response
            schemes_dict = load_schemes_by_id()
            suggested_ids = ["pm-kisan", "ntr-bharosa-oap", "deepam-2", "pm-jay", "talliki-vandanam"]
            choice_objs = []
            for cid in suggested_ids:
                s_obj = schemes_dict.get(cid)
                if s_obj:
                    choice_objs.append({
                        "scheme_id": cid,
                        "name": s_obj.get(f"name_{lang}", s_obj.get("name_en", cid))
                    })
            if lang == "te":
                no_info_text = (
                    "మీరు అడిగిన విషయంపై నాకు అధికారిక సమాచారం దొరకలేదు. "
                    "దయచేసి క్రింద ఉన్న పథకాల నుండి ఒకదాన్ని ఎంచుకోండి లేదా మీ ప్రశ్నను వేరేగా అడగండి:"
                )
            else:
                no_info_text = (
                    "I could not find verified official information for that query. "
                    "Please choose from the popular schemes below or rephrase your question:"
                )
            return {
                "answer": no_info_text,
                "speech_text": no_info_text,
                "language": lang,
                "intent": "no_answer",
                "scheme_id": None,
                "sources": [],
                "confidence": "none",
                "next_question": None,
                "eligibility": None,
                "choices": choice_objs,
                "session": sess,
                "disclaimer": disclaimer
            }

        top_chunk, score = retrieval_results[0]
        confidence = "high" if score >= 0.35 else "low"
        context_text = top_chunk.content

        # Extractive baseline answer
        final_answer = context_text
        # Optional LLM generation with faithfulness guard
        llm_candidate = self.llm.generate_answer(raw_msg, context_text, lang=lang)
        if llm_candidate and verify_faithfulness(llm_candidate, context_text, raw_msg):
            final_answer = llm_candidate

        source_info = [{
            "department": top_chunk.department,
            "title": top_chunk.source_title,
            "url": top_chunk.source_url,
            "type": top_chunk.source_type,
            "last_verified": top_chunk.last_verified
        }]

        return {
            "answer": final_answer,
            "speech_text": final_answer,
            "language": lang,
            "intent": "retrieval",
            "scheme_id": top_chunk.scheme_id,
            "sources": source_info,
            "confidence": confidence,
            "next_question": None,
            "eligibility": None,
            "choices": None,
            "session": sess,
            "disclaimer": disclaimer
        }

    def _answer_structured_scheme(
        self,
        scheme_id: str,
        topic: str,
        facts: Dict[str, Any],
        lang: str,
        sess: Dict[str, Any],
        disclaimer: str
    ) -> Dict[str, Any]:
        """Format answer from authoritative structured scheme record."""
        schemes = load_schemes_by_id()
        scheme = schemes.get(scheme_id)
        if not scheme:
            schemes_list = load_schemes()
            choice_objs = [
                {"scheme_id": s["scheme_id"], "name": s.get(f"name_{lang}", s.get("name_en", s["scheme_id"]))}
                for s in schemes_list[:5]
            ]
            fallback_text = (
                "క్షమించండి, ఆ పథకం సమాచారం సరిగ్గా లభించలేదు. దయచేసి దిగువన ఉన్న అధికారిక పథకాలలో ఒకదాన్ని ఎంచుకోండి లేదా మాట్లాడండి."
                if lang == "te" else
                "Sorry, the requested scheme details were not found. Please choose from the official schemes below or speak your query."
            )
            return {
                "answer": fallback_text,
                "speech_text": fallback_text,
                "language": lang,
                "intent": "clarify",
                "scheme_id": None,
                "sources": [],
                "confidence": "low",
                "next_question": None,
                "eligibility": None,
                "choices": choice_objs,
                "session": sess,
                "disclaimer": disclaimer
            }

        name = scheme.get(f"name_{lang}", scheme["name_en"])
        sources = self._get_scheme_sources(scheme_id)

        if topic == "eligibility":
            return self._continue_eligibility(scheme_id, facts, lang, sess, disclaimer)

        elif topic == "documents":
            doc_items = []
            speech_items = []
            for d in scheme["documents"]:
                tag = (
                    ("తప్పనిసరి" if d["required"] is True else ("ఐచ్ఛికం" if d["required"] is False else "కార్యాలయంలో నిర్ధారించుకోండి"))
                    if lang == "te" else
                    ("Required" if d["required"] is True else ("Optional" if d["required"] is False else "Confirm at office"))
                )
                doc_name = d.get(lang, d.get("en"))
                doc_items.append(f"• {doc_name} ({tag})")
                speech_items.append(doc_name)

            header = f"{name} కోసం కావలసిన పత్రాలు:" if lang == "te" else f"Documents required for {name}:"
            answer = header + "\n" + "\n".join(doc_items)
            speech = f"{header} " + ", ".join(speech_items)

            return {
                "answer": answer,
                "speech_text": speech,
                "language": lang,
                "intent": "documents",
                "scheme_id": scheme_id,
                "sources": sources,
                "confidence": "high",
                "next_question": None,
                "eligibility": None,
                "choices": None,
                "session": sess,
                "disclaimer": disclaimer
            }

        elif topic == "apply":
            step_items = []
            speech_steps = []
            for s in scheme["steps"]:
                st_text = s.get(lang, s.get("en"))
                step_items.append(f"{len(step_items)+1}. {st_text}")
                speech_steps.append(st_text)

            header = f"{name} దరఖాస్తు విధానం:" if lang == "te" else f"How to apply for {name}:"
            answer = header + "\n" + "\n".join(step_items)
            speech = f"{header} " + " ".join(speech_steps)

            return {
                "answer": answer,
                "speech_text": speech,
                "language": lang,
                "intent": "apply",
                "scheme_id": scheme_id,
                "sources": sources,
                "confidence": "high",
                "next_question": None,
                "eligibility": None,
                "choices": None,
                "session": sess,
                "disclaimer": disclaimer
            }

        elif topic == "benefits":
            b_list = scheme.get(f"benefits_{lang}", scheme["benefits_en"])
            header = f"{name} ప్రయోజనాలు:" if lang == "te" else f"Benefits of {name}:"
            answer = header + "\n" + "\n".join([f"• {b}" for b in b_list])
            speech = f"{header} " + " ".join(b_list)

            return {
                "answer": answer,
                "speech_text": speech,
                "language": lang,
                "intent": "benefits",
                "scheme_id": scheme_id,
                "sources": sources,
                "confidence": "high",
                "next_question": None,
                "eligibility": None,
                "choices": None,
                "session": sess,
                "disclaimer": disclaimer
            }

        else:  # overview
            summary = scheme.get(f"summary_{lang}", scheme["summary_en"])
            header = f"{name}:"
            answer = f"{header}\n{summary}"
            speech = f"{name}. {summary}"

            return {
                "answer": answer,
                "speech_text": speech,
                "language": lang,
                "intent": "overview",
                "scheme_id": scheme_id,
                "sources": sources,
                "confidence": "high",
                "next_question": None,
                "eligibility": None,
                "choices": None,
                "session": sess,
                "disclaimer": disclaimer
            }

    def _continue_eligibility(
        self,
        scheme_id: str,
        facts: Dict[str, Any],
        lang: str,
        sess: Dict[str, Any],
        disclaimer: str
    ) -> Dict[str, Any]:
        """Execute deterministic eligibility step or complete dialogue."""
        el_res = check_eligibility(scheme_id, facts, lang=lang)
        status = el_res["status"]
        sources = self._get_scheme_sources(scheme_id)

        if status == "cannot_determine" and el_res["missing_fields"]:
            next_f = el_res["missing_fields"][0]
            sess["pending_field"] = next_f
            sess["active_scheme_id"] = scheme_id
            fields_def = load_fields()
            f_spec = fields_def.get(next_f, {})
            q_text = f_spec.get(lang, f_spec.get("en"))
            next_q = {
                "field": next_f,
                "type": f_spec.get("type", "bool"),
                "text": q_text
            }
            return {
                "answer": q_text,
                "speech_text": q_text,
                "language": lang,
                "intent": "eligibility_question",
                "scheme_id": scheme_id,
                "sources": sources,
                "confidence": "high",
                "next_question": next_q,
                "eligibility": None,
                "choices": None,
                "session": sess,
                "disclaimer": disclaimer
            }

        # Result is decided (eligible or not_eligible or cannot_determine with no questions)
        sess["pending_field"] = None
        if status == "eligible":
            headline = "మీ సమాధానాల ప్రకారం, మీరు అర్హులుగా కనిపిస్తున్నారు." if lang == "te" else "Based on your answers, you appear to be eligible."
        elif status == "not_eligible":
            headline = "మీ సమాధానాల ప్రకారం, మీరు నిబంధనలను పూర్తి చేయలేదు." if lang == "te" else "Based on your answers, you do not meet the conditions."
        else:
            headline = "మేము మీ అర్హతను నిర్ణయించలేకపోతున్నాము. ఇది అధికారిక జాబితా లేదా స్థానిక విచారణపై ఆధారపడి ఉంటుంది." if lang == "te" else "We cannot determine eligibility from your answers. It depends on official beneficiary lists or local verification."

        why_lines = []
        for r in el_res["reasons"]:
            res_word = "సరిపోయింది" if r["result"] == "passed" else ("సరిపోలేదు" if r["result"] == "failed" else "తెలియదు") if lang == "te" else r["result"]
            icon = "✓" if r["result"] == "passed" else ("✕" if r["result"] == "failed" else "?")
            why_lines.append(f"{icon} {r['label']} — {res_word}")

        warn_block = ""
        if el_res["warnings"]:
            warn_title = "గమనించండి:" if lang == "te" else "Important Note:"
            warn_block = f"\n\n{warn_title} " + " ".join(el_res["warnings"])

        closing = "తుది నిర్ణయం ప్రభుత్వ శాఖ తీసుకుంటుంది." if lang == "te" else "The final decision is made by the government department."
        full_text = f"{headline}\n\n" + "\n".join(why_lines) + warn_block + f"\n\n{closing}"

        return {
            "answer": full_text,
            "speech_text": f"{headline} {closing}",
            "language": lang,
            "intent": "eligibility_result",
            "scheme_id": scheme_id,
            "sources": sources,
            "confidence": "high",
            "next_question": None,
            "eligibility": el_res,
            "choices": None,
            "session": sess,
            "disclaimer": disclaimer
        }

    def _get_scheme_sources(self, scheme_id: str) -> List[Dict[str, str]]:
        """Return formatted sources with department and last verified date."""
        schemes = load_schemes_by_id()
        scheme = schemes.get(scheme_id)
        if not scheme:
            return []
        res = []
        for s in scheme.get("sources", []):
            res.append({
                "department": scheme["department"],
                "title": s["title"],
                "url": s["url"],
                "type": s["type"],
                "last_verified": scheme["last_verified"]
            })
        return res
