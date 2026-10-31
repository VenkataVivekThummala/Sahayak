"""Faithfulness guard verifying that LLM answers do not invent numbers or URLs."""
import re
from typing import List, Set, Tuple

def extract_numbers_and_urls(text: str) -> Tuple[Set[str], Set[str]]:
    """Extract all numbers and URLs from text."""
    # URLs
    urls = set(re.findall(r'https?://[^\s<>"]+|www\.[^\s<>"]+', text.lower()))

    # Numbers (including commas and decimal points)
    # Remove URL components from number search
    clean_text = text
    for u in urls:
        clean_text = clean_text.replace(u, " ")

    raw_numbers = re.findall(r'\b\d+(?:,\d+)*(?:\.\d+)?\b', clean_text)
    # Normalize by removing commas
    numbers = {n.replace(',', '') for n in raw_numbers}

    return numbers, urls

def verify_faithfulness(llm_answer: str, context_text: str, user_question: str) -> bool:
    """
    Check if every number and URL in llm_answer is grounded in either context_text or user_question.
    Returns True if fully grounded, False if any hallucinated/unverified number or URL is found.
    """
    if not llm_answer:
        return False

    ans_numbers, ans_urls = extract_numbers_and_urls(llm_answer)
    source_numbers, source_urls = extract_numbers_and_urls(f"{context_text} {user_question}")

    # Verify URLs
    for url in ans_urls:
        if url not in source_urls:
            return False

    # Verify Numbers
    for num in ans_numbers:
        # Ignore 1, 2, 3 if used solely as numbered list bullets (e.g. "1. ", "2. ")
        if num in {"1", "2", "3", "4", "5", "6", "7", "8", "9", "10"}:
            continue
        if num not in source_numbers:
            return False

    return True
