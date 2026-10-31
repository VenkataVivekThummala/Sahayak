"""LLM provider interface and implementations with strict grounding constraints."""
from abc import ABC, abstractmethod
from typing import Optional
from ..config import LLM_PROVIDER, ANTHROPIC_API_KEY, LLM_MODEL

SYSTEM_PROMPT = """You are Government Sahayak, an official welfare scheme guidance assistant for rural citizens in India.
Follow these strict instructions without exception:
1. Answer ONLY using the facts present in the CONTEXT. Never invent or assume eligibility, amounts, documents, dates, or procedures.
2. NEVER declare that a citizen is eligible or not eligible. Eligibility is strictly calculated by the rule engine.
3. Keep all numbers, monetary amounts, and criteria exact as stated in the CONTEXT.
4. Use simple, direct, respectful language. Do NOT use markdown links, asterisks, or URLs in the text.
5. Reply in the user's language (Telugu or English).
6. If the context does not contain the answer, say that verified information is not available in the official records.
"""

class LLMProvider(ABC):
    """Abstract interface for LLM text generation."""
    @abstractmethod
    def generate_answer(self, query: str, context: str, lang: str = "en") -> Optional[str]:
        """Generate answer from context."""
        pass

class NoneLLMProvider(LLMProvider):
    """Fallback provider when no LLM key is configured (extractive mode)."""
    def generate_answer(self, query: str, context: str, lang: str = "en") -> Optional[str]:
        return None

class AnthropicLLMProvider(LLMProvider):
    """Anthropic Claude LLM provider implementation."""
    def __init__(self, api_key: str, model: str = LLM_MODEL):
        self.api_key = api_key
        self.model = model

    def generate_answer(self, query: str, context: str, lang: str = "en") -> Optional[str]:
        if not self.api_key:
            return None
        try:
            import httpx
            headers = {
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            prompt = f"CONTEXT:\n{context}\n\nUSER QUESTION:\n{query}\n\nANSWER (in {'Telugu' if lang == 'te' else 'English'}):"
            payload = {
                "model": self.model,
                "max_tokens": 500,
                "temperature": 0.0,
                "system": SYSTEM_PROMPT,
                "messages": [{"role": "user", "content": prompt}]
            }
            with httpx.Client(timeout=10.0) as client:
                resp = client.post("https://api.anthropic.com/v1/messages", json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    return data["content"][0]["text"].strip()
                return None
        except Exception:
            # LLM exception must never break the system
            return None

def get_llm_provider() -> LLMProvider:
    """Return configured LLM provider instance."""
    if LLM_PROVIDER.lower() == "anthropic" and ANTHROPIC_API_KEY:
        return AnthropicLLMProvider(api_key=ANTHROPIC_API_KEY)
    return NoneLLMProvider()
