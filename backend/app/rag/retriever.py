"""TF-IDF character n-gram chunk builder and retriever for Government Sahayak."""
from typing import List, Dict, Any, Optional, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from ..knowledge import load_schemes, get_primary_source
from ..config import SIMILARITY_THRESHOLD
from ..nlp.intent import preprocess_tanglish

# NOTE ON CALIBRATION:
# The default similarity threshold of 0.22 was calibrated on our in-domain vs out-of-scope
# test questions (out-of-scope queries peaked at ~0.196, whereas legitimate in-domain semantic
# queries scored >= 0.244). On larger or open-domain deployments, this threshold must be re-calibrated.

class KnowledgeChunk:
    """Represents a discrete semantic chunk of official scheme knowledge."""
    def __init__(
        self,
        chunk_id: str,
        scheme_id: str,
        scheme_name: str,
        section: str,
        department: str,
        source_title: str,
        source_url: str,
        source_type: str,
        last_verified: str,
        lang: str,
        content: str
    ):
        self.chunk_id = chunk_id
        self.scheme_id = scheme_id
        self.scheme_name = scheme_name
        self.section = section
        self.department = department
        self.source_title = source_title
        self.source_url = source_url
        self.source_type = source_type
        self.last_verified = last_verified
        self.lang = lang
        self.content = content

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "scheme_id": self.scheme_id,
            "scheme_name": self.scheme_name,
            "section": self.section,
            "department": self.department,
            "source_title": self.source_title,
            "source_url": self.source_url,
            "source_type": self.source_type,
            "last_verified": self.last_verified,
            "lang": self.lang,
            "content": self.content
        }

class Retriever:
    """Bilingual TF-IDF character n-gram retriever (works offline and on low-resource Telugu)."""
    def __init__(self):
        self.chunks: List[KnowledgeChunk] = []
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.chunk_vectors = None
        self._build_index()

    def _build_index(self):
        """Construct knowledge chunks from verified schemes and fit the TF-IDF index."""
        schemes = load_schemes()
        self.chunks = []

        for s in schemes:
            sid = s["scheme_id"]
            dept = s["department"]
            p_src = get_primary_source(s["sources"]) or {"title": "Official Portal", "url": "", "type": "official"}
            last_v = s["last_verified"]

            # English chunks
            self.chunks.append(KnowledgeChunk(
                f"{sid}-overview-en", sid, s["name_en"], "overview", dept,
                p_src["title"], p_src["url"], p_src["type"], last_v, "en",
                f"{s['name_en']}. {s['summary_en']}"
            ))
            self.chunks.append(KnowledgeChunk(
                f"{sid}-benefits-en", sid, s["name_en"], "benefits", dept,
                p_src["title"], p_src["url"], p_src["type"], last_v, "en",
                f"Benefits of {s['name_en']}: " + " ".join(s["benefits_en"])
            ))
            self.chunks.append(KnowledgeChunk(
                f"{sid}-eligibility-en", sid, s["name_en"], "eligibility", dept,
                p_src["title"], p_src["url"], p_src["type"], last_v, "en",
                f"Eligibility criteria for {s['name_en']}: " + " ".join(s["eligibility_text_en"])
            ))
            doc_en = " ".join([d["en"] + (" (Required)" if d["required"] else " (Optional)") for d in s["documents"]])
            self.chunks.append(KnowledgeChunk(
                f"{sid}-documents-en", sid, s["name_en"], "documents", dept,
                p_src["title"], p_src["url"], p_src["type"], last_v, "en",
                f"Documents needed for {s['name_en']}: {doc_en}"
            ))
            steps_en = " ".join([st["en"] for st in s["steps"]])
            self.chunks.append(KnowledgeChunk(
                f"{sid}-apply-en", sid, s["name_en"], "apply", dept,
                p_src["title"], p_src["url"], p_src["type"], last_v, "en",
                f"How to apply for {s['name_en']}: {steps_en}"
            ))

            # Telugu chunks
            self.chunks.append(KnowledgeChunk(
                f"{sid}-overview-te", sid, s["name_te"], "overview", dept,
                p_src["title"], p_src["url"], p_src["type"], last_v, "te",
                f"{s['name_te']}. {s['summary_te']}"
            ))
            self.chunks.append(KnowledgeChunk(
                f"{sid}-benefits-te", sid, s["name_te"], "benefits", dept,
                p_src["title"], p_src["url"], p_src["type"], last_v, "te",
                f"{s['name_te']} ప్రయోజనాలు: " + " ".join(s["benefits_te"])
            ))
            self.chunks.append(KnowledgeChunk(
                f"{sid}-eligibility-te", sid, s["name_te"], "eligibility", dept,
                p_src["title"], p_src["url"], p_src["type"], last_v, "te",
                f"{s['name_te']} అర్హతలు: " + " ".join(s["eligibility_text_te"])
            ))
            doc_te = " ".join([d["te"] + (" (తప్పనిసరి)" if d["required"] else " (ఐచ్ఛికం)") for d in s["documents"]])
            self.chunks.append(KnowledgeChunk(
                f"{sid}-documents-te", sid, s["name_te"], "documents", dept,
                p_src["title"], p_src["url"], p_src["type"], last_v, "te",
                f"{s['name_te']} కోసం కావలసిన పత్రాలు: {doc_te}"
            ))
            steps_te = " ".join([st["te"] for st in s["steps"]])
            self.chunks.append(KnowledgeChunk(
                f"{sid}-apply-te", sid, s["name_te"], "apply", dept,
                p_src["title"], p_src["url"], p_src["type"], last_v, "te",
                f"{s['name_te']} దరఖాస్తు విధానం: {steps_te}"
            ))

        # Vectorize corpus using character n-grams (char_wb: 2-4, sublinear tf)
        corpus_texts = [c.content for c in self.chunks]
        self.vectorizer = TfidfVectorizer(
            analyzer="char_wb",
            ngram_range=(2, 4),
            sublinear_tf=True
        )
        self.chunk_vectors = self.vectorizer.fit_transform(corpus_texts)

    QUERY_SYNONYMS = {
        # English synonyms
        "daughter": "daughter girl child sukanya samriddhi",
        "daughters": "daughter girl child sukanya samriddhi",
        "girl child": "girl child sukanya samriddhi",
        "hospital": "hospital treatment ayushman arogya health insurance",
        "medical": "medical hospital ayushman arogya health",
        "health": "health hospital ayushman arogya medical insurance",
        "farmers": "farmers kisan samman nidhi pm-kisan agriculture",
        "farmer": "farmer kisan samman nidhi pm-kisan agriculture",
        "pension": "pension old age ntr bharosa ignoaps vruddhapya",
        "pensions": "pensions old age ntr bharosa ignoaps pension",
        "house": "house housing pmay awaas gramin",
        "housing": "housing house pmay awaas gramin",
        "gas": "gas cylinder cooking lpg deepam free",
        "scholarship": "scholarship fee reimbursement vidya deevena education",
        "women": "women welfare mahashakti aadabidda deepam bus",
        "bus": "bus apsrtc mahashakti free travel women",
        "youth": "youth yuvagalam unemployed nirudyoga",
        "unemployed": "unemployed unemployment yuvagalam allowance",
        "education": "education vidya deevena scholarship fee college",
        # Telugu synonyms
        "ఆడపిల్ల": "ఆడపిల్ల సుకన్య సమృద్ధి బాలిక",
        "ఆడపిల్లల": "ఆడపిల్ల సుకన్య సమృద్ధి బాలిక",
        "చికిత్స": "ఆసుపత్రి చికిత్స ఆయుష్మాన్ ఆరోగ్య",
        "రైతులకు": "రైతులకు కిసాన్ సమ్మాన్ నిధి",
        "రైతు": "రైతు కిసాన్ సమ్మాన్ నిధి",
        "పెన్షన్": "పెన్షన్ వృద్ధాప్య పింఛను నిర్మలా",
        "పింఛను": "పింఛను వృద్ధాప్య పెన్షన్",
        "ఇల్లు": "ఇల్లు గృహ పథకం ఆవాస్",
        "గ్యాస్": "గ్యాస్ సిలిండర్ దీపం ఉచిత",
        "మహిళలు": "మహిళలు ఉచిత బస్సు మహాశక్తి ఆడబిడ్డ",
        "విద్యార్థులు": "విద్యార్థులు ఫీజు స్కాలర్‌షిప్ విద్యా దీవెన",
    }

    def expand_query(self, query: str) -> str:
        """
        Enhance welfare retrieval accuracy through:
        1. Tanglish (Romanized Telugu) preprocessing → expands to English equivalents
        2. Conservative domain term synonym expansion
        """
        # Step 1: Expand Tanglish words to English equivalents
        expanded = preprocess_tanglish(query)
        lower = expanded.lower()
        # Step 2: Domain synonym expansion
        synonyms_to_add: List[str] = []
        for term, syn in self.QUERY_SYNONYMS.items():
            if term in lower:
                synonyms_to_add.append(syn)
        if synonyms_to_add:
            expanded = expanded + " " + " ".join(synonyms_to_add)
        return expanded

    def retrieve(self, query: str, top_k: int = 3, target_lang: Optional[str] = None) -> List[Tuple[KnowledgeChunk, float]]:
        """
        Retrieve top_k matching chunks with cosine similarity score.
        Filters by target language if provided.
        """
        if not query.strip() or self.vectorizer is None:
            return []

        expanded_query = self.expand_query(query)
        query_vec = self.vectorizer.transform([expanded_query])
        scores = cosine_similarity(query_vec, self.chunk_vectors)[0]

        ranked_indices = np.argsort(scores)[::-1]
        results = []

        for idx in ranked_indices:
            chunk = self.chunks[idx]
            score = float(scores[idx])
            if target_lang and chunk.lang != target_lang:
                continue
            results.append((chunk, score))
            if len(results) >= top_k:
                break

        return results

# Singleton retriever instance
_retriever_instance: Optional[Retriever] = None

def get_retriever() -> Retriever:
    """Return singleton retriever instance."""
    global _retriever_instance
    if _retriever_instance is None:
        _retriever_instance = Retriever()
    return _retriever_instance
