"""Deterministic page audit: directives, English headings, English prose ratio.

The page marks its own languages: a run of Portuguese text sits in
`<span lang="pt">`, and every word outside such a run is English. The audit
never guesses which language a sentence is, so a Portuguese sentence is never
counted as English and an English one is never mistaken for Portuguese.

Pronunciation notation lives in `lang="pt"` spans too (PRONPARSE.md returns
those spans). A key never spans two words, so a marked run with no whitespace
inside it is notation, not prose, and it is dropped from both counts.
"""

import json
import re
import sys
from bs4 import BeautifulSoup, Comment

EN_MARKERS = {
    "the", "is", "are", "was", "were", "this", "that", "for", "with",
    "when", "you", "we", "it", "to", "in", "on", "have", "has", "do", "does",
    "did", "if", "and", "or", "but", "not", "never", "always", "before", "after",
    "how", "what", "why", "where", "both", "only", "same", "other", "another"
}

PROSE_TAGS = ["p", "li", "h2", "h3"]
WORD = re.compile(r"\b\w+\b")


def get_min_en_ratio(lesson_num: int) -> float:
    if lesson_num == 1:
        return 0.0
    elif lesson_num <= 7:
        return 0.04
    elif lesson_num <= 14:
        return 0.10
    elif lesson_num <= 22:
        return 0.16
    elif lesson_num <= 32:
        return 0.35
    elif lesson_num <= 40:
        return 0.60
    else:
        return 0.80


def is_english_clause(text: str) -> bool:
    tokens = re.findall(r"\b[a-zA-Z]+\b", text.lower())
    return len(tokens) >= 2 and any(t in EN_MARKERS for t in tokens)


def marked_pt(node) -> bool:
    return str(node.get("lang") or "").lower().startswith("pt")


def outermost_pt(el):
    """The block's `lang="pt"` elements, outermost only: a nested one is part of its parent."""

    found = []
    for node in el.find_all(attrs={"lang": True}):
        if not marked_pt(node):
            continue
        nested = False
        for ancestor in node.parents:
            if ancestor is el:
                break
            if hasattr(ancestor, "get") and marked_pt(ancestor):
                nested = True
                break
        if not nested:
            found.append(node)
    return found


def block_counts(el):
    """(all words, Portuguese words) in one block, notation already removed."""

    total = len(WORD.findall(el.get_text(" ", strip=True)))
    portuguese = sum(
        len(WORD.findall(node.get_text(" ", strip=True))) for node in outermost_pt(el)
    )
    return total, portuguese


def english_only(el) -> str:
    """The block's text with its Portuguese runs blanked - what the heading test reads."""

    text = el.get_text(" ", strip=True)
    for node in outermost_pt(el):
        run = node.get_text(" ", strip=True)
        if run:
            text = text.replace(run, " ", 1)
    return text


def audit_html_lesson(html_path: str, ledger_path: str, override_lesson_num: int = None):
    with open(ledger_path, "r", encoding="utf-8") as f:
        ledger = json.load(f)

    with open(html_path, "r", encoding="utf-8") as f:
        raw_html = f.read()

    lesson_num = override_lesson_num if override_lesson_num is not None else ledger["current_lesson"]
    train_count = len(re.findall(r"<!--\s*TRAIN_HERE", raw_html))
    quiz_count = len(re.findall(r"<!--\s*QUIZ_HERE", raw_html))
    music_count = len(re.findall(r"<!--\s*MUSIC_HERE", raw_html))

    soup = BeautifulSoup(raw_html, "html.parser")

    for comment in soup.find_all(string=lambda text: isinstance(text, Comment)):
        comment.extract()
    for el in soup.select("script, style, head, nav, footer"):
        el.decompose()
    for rt in soup.find_all("rt"):
        rt.decompose()

    # Notation: a `lang="pt"` run with no whitespace in it is a key, never a phrase.
    for node in soup.find_all(attrs={"lang": True}):
        if marked_pt(node) and not any(ch.isspace() for ch in node.get_text("", strip=False)):
            node.decompose()

    blocks = soup.find_all(PROSE_TAGS)
    headings = soup.find_all(["h2", "h3"])
    en_headings = [el for el in headings if is_english_clause(english_only(el))]

    total_prose_words = 0
    pt_word_count = 0
    en_word_count = 0
    tacked_on_blocks = 0

    for el in blocks:
        total, portuguese = block_counts(el)
        english = max(total - portuguese, 0)
        total_prose_words += total
        pt_word_count += portuguese
        en_word_count += english
        if el.name == "p" and lesson_num <= 22 and total >= 25 and english / total > 0.85:
            tacked_on_blocks += 1

    full_prose = " ".join(el.get_text(" ", strip=True) for el in blocks).lower()
    en_ratio = (en_word_count / total_prose_words) if total_prose_words > 0 else 0.0
    min_ratio = get_min_en_ratio(lesson_num)

    print(f"=== AUDIT REPORT: Lesson {lesson_num} ({ledger['track']}) ===")
    print(f"TRAIN_HERE blocks: {train_count} · QUIZ_HERE blocks: {quiz_count}")
    print(f"MUSIC_HERE blocks: {music_count}")
    print(f"Headings in English: {len(en_headings)} / {len(headings)}")
    print(f"English words: {en_word_count} / {total_prose_words} ({en_ratio:.1%})")
    print(f"Portuguese words: {pt_word_count}")
    print(f"Minimum English ratio required for Lesson {lesson_num}: {min_ratio:.0%}")

    failed = False

    if ("🎧" in raw_html or "música" in full_prose or "faixa" in full_prose) and music_count == 0:
        print("FAIL: Lesson references a song/music in prose without a <!-- MUSIC_HERE --> directive block.")
        failed = True

    if lesson_num == 1 and en_word_count > 0:
        print(
            f"NOTE: Lesson 1 carries {en_word_count} English word(s). The explanation stays in "
            "Portuguese; an English example sentence is content, not explanation."
        )

    if lesson_num >= 8 and len(headings) > 0 and len(en_headings) < max(1, len(headings) // 2):
        print(
            f"FAIL: At Lesson {lesson_num}, at least half of <h2>/<h3> headings must be in English "
            f"(currently {len(en_headings)}/{len(headings)}). Write complete, natural English headings using unlocked_lemmas + cognates."
        )
        failed = True

    if tacked_on_blocks > 0:
        print(
            f"NOTE: {tacked_on_blocks} long English-heavy <p> block(s). Prefer converting "
            "Portuguese sentences IN PLACE over appending an English block at a section end."
        )

    if lesson_num > 1 and en_ratio < min_ratio:
        print(
            f"FAIL: English prose ratio ({en_ratio:.1%}) is below the {min_ratio:.0%} minimum for Lesson {lesson_num}. "
            "Replace existing Portuguese rule sentences IN PLACE with sensible, complete English sentences."
        )
        failed = True

    if failed:
        sys.exit(1)
    else:
        print("PASS: structural directives and the bilingual ratio verified.")


if __name__ == "__main__":
    args = sys.argv[1:]
    if len(args) < 2:
        print("Usage: python scripts/audit_draft.py <lesson.html> <track_ledger.json> [override_lesson_num]")
        sys.exit(1)
    html_file = args[0]
    ledger_file = args[1]
    override = int(args[2]) if len(args) >= 3 else None
    audit_html_lesson(html_file, ledger_file, override)
