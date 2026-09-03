"""Live headlines about AI usage and student wellbeing, sourced from Google News RSS.

No API key required — Google News exposes a public RSS search endpoint. Results are
cached in-process for a few minutes so the dashboard feels live without hammering
the upstream feed on every page load.
"""

import time
from email.utils import parsedate_to_datetime
from xml.etree import ElementTree

import requests

QUERIES = [
    "AI usage students education",
    "student mental health screen time",
    "students AI dependence learning",
    "student burnout academic stress",
]

_CACHE_TTL_SECONDS = 600  # 10 minutes
_cache = {"timestamp": 0.0, "articles": []}

_HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; VidyaSetuNewsBot/1.0)"}


def _fetch_query(query: str, limit: int = 8):
    resp = requests.get(
        "https://news.google.com/rss/search",
        params={"q": query, "hl": "en-IN", "gl": "IN", "ceid": "IN:en"},
        headers=_HEADERS,
        timeout=8,
    )
    resp.raise_for_status()
    root = ElementTree.fromstring(resp.content)

    items = []
    for item in root.findall("./channel/item")[:limit]:
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        pub_date_raw = item.findtext("pubDate")
        source_el = item.find("source")
        source = (source_el.text or "").strip() if source_el is not None else None

        # Google News appends " - <Source>" to the title; strip the duplicate.
        if source and title.endswith(f" - {source}"):
            title = title[: -(len(source) + 3)].strip()

        published_at = None
        if pub_date_raw:
            try:
                published_at = parsedate_to_datetime(pub_date_raw).isoformat()
            except (TypeError, ValueError):
                published_at = None

        if not title or not link:
            continue

        items.append({
            "title": title,
            "link": link,
            "source": source or "Google News",
            "published_at": published_at,
        })
    return items


def get_news(force: bool = False):
    now = time.time()
    if not force and _cache["articles"] and (now - _cache["timestamp"]) < _CACHE_TTL_SECONDS:
        return {"articles": _cache["articles"], "cached": True, "fetched_at": _cache["timestamp"]}

    seen_titles = set()
    articles = []
    for query in QUERIES:
        try:
            for article in _fetch_query(query):
                key = article["title"].lower()
                if key in seen_titles:
                    continue
                seen_titles.add(key)
                articles.append(article)
        except (requests.RequestException, ElementTree.ParseError):
            continue

    articles.sort(key=lambda a: a["published_at"] or "", reverse=True)
    articles = articles[:16]

    # Keep serving the previous batch if every query failed (e.g. offline sandbox).
    if articles:
        _cache["articles"] = articles
        _cache["timestamp"] = now
        return {"articles": articles, "cached": False, "fetched_at": now}

    return {"articles": _cache["articles"], "cached": True, "fetched_at": _cache["timestamp"]}
