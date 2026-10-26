#!/usr/bin/env python3
"""Builds the Quran Animals site from content.json.

Run `python3 build.py` after changing content.json. It writes:
  index.html, books/index.html, books/<slug>/index.html, shop/index.html,
  404.html, sitemap.xml, robots.txt
"""
import json
from html import escape
from pathlib import Path

ROOT = Path(__file__).parent
C = json.loads((ROOT / "content.json").read_text(encoding="utf-8"))
SITE, BOOKS = C["site"], C["books"]


def e(s):
    return escape(str(s), quote=True)


def tint(b):
    return f'style="--t-l:{b["tint"]};--t-d:{b["tint_dark"]}"'


# ---------- shared pieces ----------

def head(title, description, path, image="img/bee.webp", extra=""):
    url = SITE["domain"] + path
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(description)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(description)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE['domain']}/{image}">
<link rel="icon" href="/img/bee.webp">
<link rel="stylesheet" href="/assets/fonts.css">
<link rel="stylesheet" href="/assets/style.css">
<link rel="stylesheet" href="/assets/theme.css">
{extra}</head>
<body>
{SPRITE}
"""


CURRENT = ' aria-current="page"'


# Hand-drawn doodles, used with doodle("sun", "d-sun") etc.
VB = {"sun": "0 0 100 100", "cloud": "0 0 110 64", "star": "0 0 24 24", "heart": "0 0 24 22",
      "flower": "0 0 40 40", "bee": "0 0 120 100", "trail": "0 0 260 120", "whale": "0 0 120 100"}
SPRITE = """<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <defs><clipPath id="bee-body-clip"><ellipse cx="62" cy="62" rx="34" ry="27"/></clipPath></defs>
  <symbol id="sun" viewBox="0 0 100 100">
    <g class="ink-sun-ray" stroke-width="6" stroke-linecap="round">
      <line x1="50" y1="4" x2="50" y2="18"/><line x1="50" y1="82" x2="50" y2="96"/><line x1="4" y1="50" x2="18" y2="50"/><line x1="82" y1="50" x2="96" y2="50"/>
      <line x1="17" y1="17" x2="27" y2="27"/><line x1="73" y1="73" x2="83" y2="83"/><line x1="17" y1="83" x2="27" y2="73"/><line x1="73" y1="27" x2="83" y2="17"/>
    </g>
    <circle cx="50" cy="50" r="24" class="ink-sun"/>
    <circle cx="42" cy="46" r="2.6" fill="#2d2a5a"/><circle cx="58" cy="46" r="2.6" fill="#2d2a5a"/>
    <path d="M42 56 Q50 63 58 56" stroke="#2d2a5a" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  </symbol>
  <symbol id="cloud" viewBox="0 0 110 64">
    <g class="ink-cloud"><circle cx="32" cy="38" r="18"/><circle cx="56" cy="28" r="24"/><circle cx="82" cy="40" r="16"/><rect x="14" y="38" width="84" height="22" rx="11"/></g>
  </symbol>
  <symbol id="star" viewBox="0 0 24 24"><path class="ink-star" d="M12 1.5l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.6 5.6 21.1 7 14l-5.3-5 7.2-.9z"/></symbol>
  <symbol id="heart" viewBox="0 0 24 22"><path class="ink-heart" d="M12 21C5 15 1 11 1 7a5 5 0 0 1 11-3 5 5 0 0 1 11 3c0 4-4 8-11 14z"/></symbol>
  <symbol id="flower" viewBox="0 0 40 40">
    <g class="ink-petal"><circle cx="20" cy="9" r="8"/><circle cx="31" cy="17" r="8"/><circle cx="27" cy="30" r="8"/><circle cx="13" cy="30" r="8"/><circle cx="9" cy="17" r="8"/></g>
    <circle cx="20" cy="21" r="6.5" class="ink-centre"/>
  </symbol>
  <symbol id="bee" viewBox="0 0 120 100">
    <ellipse cx="48" cy="30" rx="16" ry="22" transform="rotate(-25 48 30)" class="ink-bee-wing"/>
    <ellipse cx="74" cy="28" rx="15" ry="21" transform="rotate(20 74 28)" class="ink-bee-wing"/>
    <ellipse cx="62" cy="62" rx="34" ry="27" class="ink-bee-body"/>
    <g clip-path="url(#bee-body-clip)" class="ink-bee-stripe"><rect x="54" y="30" width="9" height="70"/><rect x="72" y="30" width="9" height="70"/></g>
    <path d="M95 62 l12 -3 -10 9z" class="ink-bee-stripe"/>
    <path d="M38 40 Q30 22 22 20 M48 37 Q46 20 40 14" class="ink-bee-line"/>
    <circle cx="22" cy="20" r="4" class="ink-bee-stripe"/><circle cx="40" cy="14" r="4" class="ink-bee-stripe"/>
    <circle cx="38" cy="58" r="4.5" class="ink-bee-stripe"/><circle cx="50" cy="56" r="4.5" class="ink-bee-stripe"/>
    <circle cx="37" cy="56.5" r="1.5" fill="#ffffff"/><circle cx="49" cy="54.5" r="1.5" fill="#ffffff"/>
    <path d="M39 68 Q45 74 51 67" class="ink-bee-line"/>
    <circle cx="33" cy="67" r="4" class="ink-bee-cheek"/><circle cx="56" cy="64" r="4" class="ink-bee-cheek"/>
  </symbol>
  <symbol id="whale" viewBox="0 0 120 100">
    <path class="ink-water" d="M56 30 q-6 -12 -2 -20 M60 30 q0 -14 6 -20 M64 30 q6 -10 14 -12" stroke="#8fd3f5" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path class="ink-whale" d="M14 62 C14 40 34 30 58 30 C86 30 100 46 100 58 L112 44 C116 52 116 64 108 72 L100 68 C96 82 78 90 56 90 C30 90 14 80 14 62Z"/>
    <path class="ink-whale-belly" d="M22 70 C34 84 70 86 92 72 C84 82 70 88 56 88 C38 88 26 80 22 70Z"/>
    <circle cx="36" cy="56" r="4.5" fill="#2d2a5a"/><circle cx="35" cy="54.5" r="1.5" fill="#ffffff"/>
    <path d="M28 66 Q36 72 44 66" stroke="#2d2a5a" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="26" cy="64" r="3.5" class="ink-bee-cheek"/>
  </symbol>
  <symbol id="trail" viewBox="0 0 260 120"><path class="ink-trail" d="M5 105 C 50 30, 95 115, 130 70 S 200 5, 255 45"/></symbol>
</svg>"""


def doodle(sym, cls, style=""):
    st = f' style="{style}"' if style else ""
    return f'<svg class="doodle {cls}" viewBox="{VB[sym]}"{st} aria-hidden="true" focusable="false"><use href="#{sym}"/></svg>'


def doodles(*items):
    return '<div class="doodles" aria-hidden="true">' + "".join(doodle(*i) for i in items) + "</div>"


def nav(current):
    items = [("/", "Home", ""), ("/books/", "Books", "keep"), ("/play/", "Play", "keep"),
             ("/ramadan/", "Ramadan", ""), ("/#author", "Author", ""), ("/shop/", "Shop", "keep")]
    links = "\n        ".join(
        f'<a href="{href}" class="{cls}"{CURRENT if href == current else ""}>{label}</a>'
        for href, label, cls in items)
    return f"""<nav class="top" aria-label="Main">
  <div class="inner">
    <a class="logo" href="/">Quran <span>Animals</span></a>
    <div class="links">
        {links}
    </div>
  </div>
</nav>
"""


def footer():
    ct = C["contact"]
    social = []
    if ct.get("instagram"):
        social.append(f'<a href="https://instagram.com/{e(ct["instagram"])}" target="_blank" rel="noopener">Instagram</a>')
    if ct.get("telegram"):
        social.append(f'<a href="https://t.me/{e(ct["telegram"])}" target="_blank" rel="noopener">Telegram</a>')
    if ct.get("tiktok"):
        social.append(f'<a href="https://tiktok.com/@{e(ct["tiktok"])}" target="_blank" rel="noopener">TikTok</a>')
    if ct.get("email"):
        social.append(f'<a href="mailto:{e(ct["email"])}">{e(ct["email"])}</a>')
    return f"""<footer>
  <div class="inner">
    <span>© 2026 {e(SITE['author'])} · {e(SITE['series'])} · <a href="/legal/">Legal notice</a> · <a href="/privacy/">Privacy</a></span>
    <div class="social">{"".join(social)}</div>
    <a href="#top">Back to top</a>
  </div>
</footer>
"""


def cover(b, eager=False):
    if b["cover"]:
        load = "" if eager else ' loading="lazy"'
        return f'<div class="cover"><img src="/{e(b["cover"])}" alt="Cover of {e(b["name"])}: {e(b["lesson"])}"{load}></div>'
    return (f'<div class="cover blank"><span class="big-ar" lang="ar">{b["ar"]}</span>'
            f'<strong>{e(b["name"])}</strong><small>Cover coming soon</small></div>')


def card(b):
    return f"""<a class="book tinted" href="/books/{b['slug']}/" {tint(b)}>
      {cover(b)}
      <div class="info">
        <div class="meta"><span class="num">Book {b['n']}{' · <span class="soon-tag">Coming soon</span>' if b.get('status') == 'soon' else ''}</span><span class="ar" lang="ar">{b['ar']}</span></div>
        <h3>{e(b['name'])}</h3>
        <p class="lesson">{e(b['lesson'])}</p>
        <p class="hook">{e(b['hook'])}</p>
        <span class="more">Read more →</span>
      </div>
    </a>"""


def shelf():
    return '<div class="shelf">\n    ' + "\n    ".join(card(b) for b in BOOKS) + "\n  </div>"


def coming_soon():
    items = "\n      ".join(
        f'<div class="next-book"><span class="ar" lang="ar">{b["ar"]}</span><span>Book {b["n"]}</span>'
        f'<strong>{e(b["name"])}</strong><span class="lesson">{e(b["lesson"])}</span><span>{e(b["ref"])}</span></div>'
        for b in C["coming_soon"])
    if C["signup_form"]:
        form = f"""<form action="{e(C['signup_form'])}" method="POST">
        <input type="hidden" name="_subject" value="New sign-up: Quran Animals new books">
        <input id="signup-email" aria-label="Your email" type="email" name="email" placeholder="Your email" required autocomplete="email">
        <button class="btn btn-gold" type="submit">Notify me</button>
      </form>"""
    else:
        form = '<p class="soon">Email sign-up opens soon.</p>'
    return f"""<div class="upcoming">
      {items}
    </div>
    <div class="signup" id="notify">
      <h3>Be the first to meet the new friends</h3>
      <p>Sign up to be notified when new books are released.</p>
      {form}
      <p class="consent">We only use your email to tell you about new books. You can unsubscribe at any time. <a href="/privacy/">Privacy policy</a></p>
    </div>"""


def more_card(m):
    series = f'<span class="more-series">{e(m["series"])}</span>' if m["series"] else ""
    return f"""<article class="more-book" id="{e(m['id'])}">
      <div class="more-cover"><img src="/{e(m['img'])}" alt="Cover of {e(m['title'])}" loading="lazy"></div>
      <div class="more-body">
        <span class="tag">Coming soon</span>
        <span class="more-kind">{e(m['kind'])}</span>
        {series}
        <h3 lang="fr">{e(m['title'])}</h3>
        <p class="more-en">{e(m['title_en'])}</p>
        <p>{e(m['about'])}</p>
        <div class="cta"><a class="btn btn-ghost" href="/#notify">Notify me when it's out</a></div>
      </div>
    </article>"""


def more_section(band=False):
    cls = ' class="band"' if band else ""
    return f"""<section{cls} id="more-books">
  <div class="inner">
    <div class="eyebrow">Also by {e(SITE['author'])}</div>
    <h2>New books on the way</h2>
    <p class="sec-intro">A new children's series and a book for mothers, in French, English and Russian.</p>
    <div class="more-grid">{"".join(more_card(m) for m in C["more_books"])}</div>
  </div>
</section>
"""


def buy_buttons(b):
    if b.get("status") == "soon":
        return """<div class="buybox">
        <p class="soon-title">Coming soon</p>
        <p class="alt">This book is still being written. Leave your email to hear the day it comes out.</p>
        <div class="cta"><a class="btn btn-gold" href="/#notify">Notify me</a></div>
      </div>"""
    if b["amazon"]:
        amazon = f'<a class="btn btn-gold" href="{e(b["amazon"])}" target="_blank" rel="noopener">Buy on Amazon</a>'
    elif C["amazon_series"]:
        amazon = f'<a class="btn btn-gold" href="{e(C["amazon_series"])}" target="_blank" rel="noopener">Buy on Amazon</a>'
    else:
        amazon = '<span class="btn btn-gold" aria-disabled="true">Buy on Amazon · coming soon</span>'
    direct = b["print"] or C["payhip_shop"] or "/shop/#print"
    ext = ' target="_blank" rel="noopener"' if direct.startswith("http") else ""
    first = min(z["first"] for z in C["shipping"]["zones"])
    price_txt = f' · €{C["book_price"]:.2f}' if C["book_price"] else ""
    return f"""<div class="buybox">
        <div class="cta">{amazon}</div>
        <p class="alt">Order a <b>signed copy</b> from the author, posted from France{price_txt}. <a href="{e(direct)}"{ext}>Order here →</a></p>
        <p class="alt">Shipping from €{first:.2f}. <a href="/shop/#shipping">Check the cost for your country</a></p>
      </div>"""


def quiz_section():
    data = [{k: b[k] for k in ("id", "animal", "ar", "lesson", "cover", "tint", "tint_dark")} for b in BOOKS]
    return f"""<section class="band" id="quiz">
  <div class="inner">
    <div class="eyebrow">For little readers</div>
    <h2>Who is my animal friend?</h2>
    <p class="sec-intro">Six quick questions about the animals from the books. Read them together and tap the right friend.</p>
    <div class="quiz" id="quiz-box" aria-live="polite"></div>
    <script type="application/json" id="quiz-data">{json.dumps(data, ensure_ascii=False)}</script>
  </div>
</section>
"""


def gallery_section():
    by_id = {b["id"]: b for b in BOOKS}
    if C["gallery"]:
        figs = []
        for g in C["gallery"]:
            sub = " · ".join(x for x in [f'age {g["age"]}' if g.get("age") else "",
                                          by_id[g["animal"]]["animal"] if g.get("animal") in by_id else ""] if x)
            figs.append(f'<figure class="art"><img src="/{e(g["img"])}" alt="Drawing by {e(g["name"])}" loading="lazy">'
                        f'<figcaption>{e(g["name"])}{f"<small>{e(sub)}</small>" if sub else ""}</figcaption></figure>')
        body = '<div class="gallery">' + "".join(figs) + "</div>"
    else:
        email = C["contact"].get("email")
        send = f' Email it to <b>{e(email)}</b>.' if email else ""
        body = f"""<div class="frames" aria-hidden="true"><div class="frame">نحلة</div><div class="frame">نملة</div><div class="frame">هدهد</div></div>
    <div class="invite"><p><strong>The first drawings are coming soon</strong>Has your child drawn Nur, Namla or Hudhud? Send us a photo of the drawing with your child's first name and age, and we may add it here.{send}</p></div>"""
    return f"""<section id="gallery">
  <div class="inner">
    <div class="eyebrow">Little artists</div>
    <h2>Drawings by our readers</h2>
    <p class="sec-intro">Children draw their favourite animal friends from the books. Here we share their art.</p>
    {body}
  </div>
</section>
"""


def page(path, title, description, body, current, image="img/bee.webp", extra_head="", scripts=""):
    out = ROOT / path.lstrip("/") / "index.html" if path.endswith("/") else ROOT / path.lstrip("/")
    out.parent.mkdir(parents=True, exist_ok=True)
    html = head(title, description, path, image, extra_head) + nav(current) + body + footer() + scripts + "</body>\n</html>\n"
    if path == "/bookmarks/":
        html = html.replace("<body>", '<body class="bm-page">', 1)
    out.write_text(html, encoding="utf-8")


# ---------- pages ----------

features = "".join(f"<li>{e(f)}</li>" for f in SITE["features"])
chips = (f'<ul class="meta-chips"><li>Ages {e(SITE["ages"])}</li><li>{e(SITE["languages"])}</li>'
         f'<li>{sum(b.get("status") != "soon" for b in BOOKS)} books · more coming</li></ul>')
b1 = BOOKS[0]

HERO_DOODLES = doodles(("star", "d-star", "top:12%;left:47%"), ("star", "d-star", "top:82%;left:50%;animation-delay:1.3s"),
                       ("star", "d-star", "top:8%;right:5%;animation-delay:2.1s"), ("star", "d-star", "bottom:10%;left:3%;animation-delay:.6s"))
home = f"""<header class="hero" id="top">
  {HERO_DOODLES}
  <div class="inner">
    <div>
      <div class="eyebrow">A children's book series by {e(SITE['author'])}</div>
      <h1>{e(SITE['series'])}</h1>
      <p class="lede">{e(SITE['intro'])}</p>
      <ul class="features">{features}</ul>
      {chips}
      <div class="cta">
        <a class="btn btn-gold" href="/books/">See all books</a>
        <a class="btn btn-ghost" href="#quiz">Play the quiz</a>
      </div>
    </div>
    <div class="hero-art">
      <img src="/{b1['cover']}" alt="Cover of {e(b1['name'])}: {e(b1['lesson'])}">
      <a class="badge" href="/books/{b1['slug']}/">Book 1 · {e(b1['name'])}<small>Start the series here →</small></a>
    </div>
  </div>
</header>

<div class="band tagline">
  <div class="inner">
    <blockquote>“{e(SITE['tagline'])}”</blockquote>
    <cite>— {e(SITE['author'])}</cite>
  </div>
</div>

<div class="inner" style="padding-top:40px">
  <a class="ram-banner" href="/ramadan/">
    <div><strong>Ramadan with the Quran Animals</strong><span>A good deed and a dua for every day. Fill Nur's honey jar!</span></div>
    <span class="btn">Open the chart</span>
  </a>
</div>

<section id="books">
  {doodles(("star", "d-star", "top:40px;right:6%"), ("heart", "d-heart", "top:90px;right:12%"), ("flower", "d-flower", "bottom:30px;left:2%"))}
  <div class="inner" style="position:relative">
    <div class="sec-head">
      <div>
        <div class="eyebrow">The series</div>
        <h2>Meet a new Quran Animal in every book</h2>
        <p class="sec-intro">Each beautifully illustrated story introduces a real animal from the Quran, shares the exact verse and teaches a meaningful life lesson.</p>
      </div>
    </div>
    {shelf()}
  </div>
</section>

<section class="band" id="coming-soon">
  <div class="inner">
    <div class="eyebrow">Coming soon</div>
    <h2>More friends on the way</h2>
    <p class="sec-intro">Five new animals are already waiting for Yusuf and Maryam.</p>
    {coming_soon()}
  </div>
</section>

{more_section()}
<section id="play">
  <div class="inner">
    <div class="eyebrow">Kids' corner</div>
    <h2>Play with the Quran Animals</h2>
    <p class="sec-intro">Games for little readers, safe to play with no ads and nothing to buy.</p>
    <div class="play-tiles">
      <a class="play-tile" href="/bookmarks/"><svg viewBox="0 0 24 22" aria-hidden="true"><use href="#heart"/></svg><strong>Bookmarks</strong><span>Pick your favourite friends and print your own bookmarks.</span></a>
      <a class="play-tile" href="/alphabet/"><span class="tile-ar" lang="ar" aria-hidden="true">أ ب</span><strong>Alif Ba</strong><span>Learn the Arabic letters and trace them with your finger.</span></a>
      <a class="play-tile" href="/play/#memory"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#star"/></svg><strong>Find the pair</strong><span>Turn the cards and match the animal friends.</span></a>
      <a class="play-tile" href="/play/#quiz"><svg viewBox="0 0 24 22" aria-hidden="true"><use href="#heart"/></svg><strong>Who is my animal friend?</strong><span>A six-question quiz about the books.</span></a>
      <a class="play-tile" href="/ramadan/"><svg viewBox="0 0 120 100" aria-hidden="true"><use href="#bee"/></svg><strong>Ramadan chart</strong><span>A good deed every day. Fill Nur's honey jar!</span></a>
    </div>
  </div>
</section>
{gallery_section().replace('<section id="gallery">', '<section class="band pink" id="gallery">')}
<section id="author">
  <div class="inner author">
    <div class="monogram" aria-hidden="true">LN</div>
    <div>
      <div class="eyebrow">About the author</div>
      <h2>{e(SITE['author'])}</h2>
      <p class="author-role">Teacher for 18 years · mother · author of books for children and families</p>
      {"".join(f"<p>{e(x)}</p>" for x in SITE['author_bio'])}
      <blockquote class="author-quote">“{e(SITE['author_quote'])}”</blockquote>
    </div>
  </div>
</section>
"""
page("/", f"{SITE['series']} · Islamic children's books by {SITE['author']}", SITE["seo"], home, "/")

books_page = f"""<header class="inner" id="top" style="padding-block:48px 8px">
  <div class="eyebrow">{e(SITE['series'])} · Ages {e(SITE['ages'])} · {e(SITE['languages'])}</div>
  <h1>All books</h1>
  <p class="lede">{e(SITE['intro'])}</p>
</header>
<section style="padding-top:24px">
  <div class="inner">
    {shelf()}
  </div>
</section>
<section class="band" id="coming-soon">
  <div class="inner">
    <div class="eyebrow">Coming soon</div>
    <h2>More friends on the way</h2>
    {coming_soon()}
  </div>
</section>
{more_section()}"""
page("/books/", f"All books · {SITE['series']}", SITE["seo"], books_page, "/books/")

for i, b in enumerate(BOOKS):
    prev_b = BOOKS[i - 1] if i > 0 else None
    next_b = BOOKS[i + 1] if i < len(BOOKS) - 1 else None
    discover = "".join(f"<li>{e(d)}</li>" for d in b["discover"])
    pager = '<div class="pager inner">'
    pager += (f'<a href="/books/{prev_b["slug"]}/"><small>← Book {prev_b["n"]}</small>{e(prev_b["name"])}</a>' if prev_b else "<span></span>")
    pager += (f'<a href="/books/{next_b["slug"]}/" style="text-align:right"><small>Book {next_b["n"]} →</small>{e(next_b["name"])}</a>' if next_b else "<span></span>")
    pager += "</div>"
    ld = {
        "@context": "https://schema.org", "@type": "Book",
        "name": f'{b["name"]}: {b["lesson"]}', "author": {"@type": "Person", "name": SITE["author"]},
        "bookFormat": "https://schema.org/Paperback", "inLanguage": ["en", "fr", "ru"],
        "typicalAgeRange": "5-8", "description": b["seo"],
        "isPartOf": {"@type": "BookSeries", "name": SITE["series"]}, "position": b["n"],
        "url": f'{SITE["domain"]}/books/{b["slug"]}/',
    }
    if b["cover"]:
        ld["image"] = f'{SITE["domain"]}/{b["cover"]}'
    body = f"""<div class="inner crumbs" id="top"><a href="/books/">Books</a> / Book {b['n']}</div>
<main class="inner bookpage tinted" {tint(b)}>
  {cover(b, eager=True)}
  <div>
    <div class="eyebrow">{e(SITE['series'])} · Book {b['n']}{' · Coming soon' if b.get('status') == 'soon' else ''}</div>
    <h1>{e(b['name'])}</h1>
    <p class="lesson">{e(b['lesson'])}</p>
    <ul class="meta-chips">
      <li>Ages {e(SITE['ages'])}</li>
      <li>{e(SITE['languages'])}</li>
      <li>{e(b['surah'])} · {e(b['chapter'])}</li>
    </ul>
    <p class="hook-big">{e(b['hook'])}</p>
    <p class="desc">{e(b['description'])}</p>
    <p class="label">In this book children will discover</p>
    <ul class="discover">{discover}</ul>
    <figure class="ayah">
      <p>“{e(b['quote'])}”</p>
      <cite>{e(b['quote_ref'])}</cite>
    </figure>
    <p class="includes"><b>Includes:</b> {e(b['includes'])}</p>
    {buy_buttons(b)}
  </div>
</main>
{pager}
"""
    page(f"/books/{b['slug']}/", f"{b['name']}: {b['lesson']} · {SITE['series']} Book {b['n']}", b["seo"], body,
         "/books/", image=b["cover"] or "img/bee.webp",
         extra_head=f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>\n')

# Shop
amazon_series = C["amazon_series"]
amazon_btn = (f'<a class="btn btn-ghost" href="{e(amazon_series)}" target="_blank" rel="noopener">Open on Amazon</a>'
              if amazon_series else '<span class="soon">Coming soon</span>')
print_btn = (f'<a class="btn btn-gold" href="{e(C["payhip_shop"])}" target="_blank" rel="noopener">Order a book</a>'
             if C["payhip_shop"] else '<span class="soon">Coming soon</span>')
if C["activity_books"]:
    acts = '<div class="acts">' + "".join(
        f"""<article class="act"><img src="/{e(a['img'])}" alt="{e(a['title'])}" loading="lazy">
        <div class="act-body"><span class="tag">PDF</span><h3>{e(a['title'])}</h3><p>{e(a['about'])}</p>
        <div class="act-foot"><span class="price">{e(a['price'])}</span>
        <a class="btn btn-gold" href="{e(a['url'])}" target="_blank" rel="noopener">Buy &amp; download</a></div></div></article>"""
        for a in C["activity_books"]) + "</div>"
else:
    ideas = [("Colour the animal friends", "Colouring pages with Nur, Namla, Hudhud and the others."),
             ("First Arabic words", "Trace and match the animals' names in Arabic."),
             ("Ramadan with the animals", "A gentle activity book for the blessed month.")]
    acts = '<div class="acts">' + "".join(
        f'<div class="act-ghost"><span class="tag">Coming soon</span><strong>{e(h)}</strong><span>{e(p)}</span></div>'
        for h, p in ideas) + "</div>"
ship_data = {"zones": C["shipping"]["zones"], "max_books": C["shipping"]["max_books"], "book_price": C["book_price"],
             "bundles": [{"books": x["books"], "price": x["price"], "name": x["name"]} for x in C["bundles"]]}

def bundle_card(x):
    full = C["book_price"] * x["books"] if C["book_price"] else None
    was = f'<span class="was">€{full:.2f}</span>' if full and full > x["price"] else ""
    btn = (f'<a class="btn btn-gold" href="{e(x["url"])}" target="_blank" rel="noopener">Order</a>' if x["url"]
           else (f'<a class="btn btn-gold" href="{e(C["payhip_shop"])}" target="_blank" rel="noopener">Order</a>' if C["payhip_shop"]
                 else '<span class="soon">Coming soon</span>'))
    return (f'<div class="bundle"><span class="tag">{x["books"]} books · signed</span><h3>{e(x["name"])}</h3>'
            f'<p>{e(x["about"])}</p><div class="act-foot"><span class="price">€{x["price"]:.2f} {was}</span>{btn}</div></div>')

bundles_html = "".join(bundle_card(x) for x in C["bundles"])

price_line = f'€{C["book_price"]:.2f} per book. ' if C["book_price"] else ""
shop = f"""<header class="inner" id="top" style="padding-block:48px 8px">
  <div class="eyebrow">Shop</div>
  <h1>Get the books</h1>
  <p class="lede">Pick whatever suits your family best.</p>
</header>
<section style="padding-top:24px">
  <div class="inner">
    <div class="ways">
      <div class="way"><h3>On Amazon</h3><p>Printed books, delivered by Amazon.</p>{amazon_btn}</div>
      <div class="way" id="print"><h3>Signed copies from the author</h3><p>{price_line}Signed, packed and posted from France by {e(SITE['author'])} herself.</p>{print_btn}</div>
      <div class="way"><h3>Activity books (PDF)</h3><p>Pay, download in a minute and print at home.</p><a class="btn btn-ghost" href="#activity">See activity books</a></div>
    </div>
  </div>
</section>
<section id="bundles" style="padding-top:8px">
  <div class="inner">
    <div class="eyebrow">Signed bundles</div>
    <h2>Save on a set</h2>
    <p class="sec-intro">Order several signed books together in one parcel.</p>
    <div class="bundles">{bundles_html}</div>
  </div>
</section>
<section class="band mint" id="shipping">
  <div class="inner">
    <div class="ship">
      <h3>Shipping calculator</h3>
      <p class="ship-from">For books ordered from the author. They are posted from France.</p>
      <div class="ship-row">
        <div class="field">
          <label for="ship-zone">Your country</label>
          <select id="ship-zone"></select>
        </div>
        <div class="field">
          <label id="ship-qty-label">Books</label>
          <div class="stepper" role="group" aria-labelledby="ship-qty-label">
            <button type="button" id="ship-minus" aria-label="One book less">−</button>
            <output id="ship-qty" aria-live="polite">1</output>
            <button type="button" id="ship-plus" aria-label="One book more">+</button>
          </div>
        </div>
      </div>
      <div class="ship-out" id="ship-out" aria-live="polite"></div>
      <p class="ship-note" id="ship-note"></p>
    </div>
    <script type="application/json" id="ship-data">{json.dumps(ship_data, ensure_ascii=False)}</script>
  </div>
</section>
<section id="activity">
  <div class="inner">
    <div class="eyebrow">Printable PDFs</div>
    <h2>Activity books for little Muslims</h2>
    <p class="sec-intro">Colouring pages, puzzles and simple activities with the animal friends. Buy, download straight away and print at home as many times as you like.</p>
    {acts}
  </div>
</section>
"""
page("/shop/", f"Shop · {SITE['series']}", "Buy the Quran Animals books on Amazon or directly from the author, and printable activity books for Muslim children.",
     shop, "/shop/", scripts='<script src="/assets/shop.js" defer></script>\n')

# Kids' corner
mem_data = [{"id": b["id"], "animal": b["animal"], "name": b["name"], "ar": b["ar"], "tr": b["tr"], "img": b["friend_img"],
             "tint": b["tint"], "tint_dark": b["tint_dark"]} for b in BOOKS]
play = f"""<header class="play-hero" id="top">
  {doodles(("cloud", "d-cloud c1"), ("sun", "d-sun"), ("star", "d-star", "top:40%;left:52%"), ("heart", "d-heart", "top:20%;left:40%"))}
  <div class="inner">
    <div class="eyebrow">Kids' corner</div>
    <h1>Let's play!</h1>
    <p class="lede">Games with Nur, Namla, Hudhud and all the animal friends. Play together with a grown-up.</p>
    <div class="cta"><a class="btn btn-gold" href="/alphabet/">Alif Ba</a><a class="btn btn-ghost" href="/bookmarks/">Bookmarks</a><a class="btn btn-ghost" href="#memory">Find the pair</a><a class="btn btn-ghost" href="#quiz">Quiz</a><a class="btn btn-ghost" href="/ramadan/">Ramadan chart</a></div>
  </div>
</header>
<section id="memory">
  <div class="inner">
    <h2>Find the pair</h2>
    <p class="sec-intro">Turn two cards. If they show the same friend, you found a pair! In the Arabic game, match each animal with its Arabic name.</p>
    <div class="mem">
      <div class="mem-top">
        <div class="mem-levels" role="group" aria-label="Game">
          <button type="button" class="mem-level" data-level="little" aria-pressed="true">Little · 3 pairs</button>
          <button type="button" class="mem-level" data-level="big" aria-pressed="false">Big · 6 pairs</button>
          <button type="button" class="mem-level" data-level="arabic" aria-pressed="false">Arabic words</button>
        </div>
        <div class="mem-tools">
          <button type="button" class="mem-tool" id="mem-sound" aria-pressed="false">Sound: off</button>
          <button type="button" class="mem-tool" id="mem-restart">New game</button>
        </div>
      </div>
      <div class="mem-score"><span>Moves <b id="mem-moves">0</b></span><span>Pairs <b id="mem-found">0 / 3</b></span></div>
      <p class="mem-status" id="mem-status" aria-live="polite"></p>
      <div class="mem-board" id="mem-board"></div>
      <div class="mem-win" id="mem-win" hidden>
        <div class="mem-stars" role="img"></div>
        <h3>MashaAllah!</h3>
        <p class="mem-sum"></p>
        <button type="button" class="btn btn-gold" id="mem-again">Play again</button>
      </div>
      <div class="mem-confetti" id="mem-confetti" aria-hidden="true"></div>
    </div>
    <script type="application/json" id="memory-data">{json.dumps(mem_data, ensure_ascii=False)}</script>
  </div>
</section>
{quiz_section()}
"""
page("/play/", f"Kids' corner · {SITE['series']}", "Free games for Muslim children with the Quran Animals: find the pair, a quiz and a Ramadan chart.",
     play, "/play/", scripts='<script src="/assets/memory.js" defer></script>\n<script src="/assets/quiz.js" defer></script>\n')

# Bookmarks to print
BY_ID = {b["id"]: b for b in BOOKS}


def bookmark(m):
    who = '<div class="bm-fill" aria-hidden="true"></div><div class="bm-own">This bookmark belongs to<span class="bm-name"></span></div><div class="bm-site">liliianoor.com</div>'
    if m.get("friend"):
        b = BY_ID[m["friend"]]
        ref = f'<cite>{e(m["ref"])}</cite>' if m["ref"] else ""
        return f"""<div class="bm tinted" style="--t-l:{b['tint']};--t-d:{b['tint']}">
        <div class="bm-hole"></div>
        <div class="bm-pic"><img src="/{e(b['friend_img'])}" alt=""></div>
        <div class="bm-ar" lang="ar">{b['ar']}</div>
        <div class="bm-title">{e(b['name'])}</div>
        <div class="bm-sub">{e(b['lesson'])}</div>
        <p class="bm-line">“{e(m['line'])}”{ref}</p>
        {who}</div>"""
    if m["kind"] == "malik":
        return f"""<div class="bm tinted" style="--t-l:{m['tint']};--t-d:{m['tint']}">
        <div class="bm-hole"></div>
        <div class="bm-pic"><img src="/{e(m['img'])}" alt="" style="object-position:30% 40%"></div>
        <div class="bm-kicker">Les questions de</div>
        <div class="bm-title">{e(m['title'])}</div>
        <div class="bm-sub">{e(m['sub'])}</div>
        <p class="bm-line">{e(m['line'])}</p>
        {who}</div>"""
    if m["kind"] == "ramadan":
        stars = "".join(f'<span><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#star"/></svg><b>{i}</b></span>' for i in range(1, 31))
        return f"""<div class="bm bm-night">
        <div class="bm-hole"></div>
        <div class="bm-moon" aria-hidden="true"></div>
        <div class="bm-title">{e(m['title'])}</div>
        <div class="bm-sub">{e(m['sub'])}</div>
        <div class="bm-stars">{stars}</div>
        <p class="bm-line">{e(m['line'])}</p>
        {who}</div>"""
    letters = "".join(f'<span lang="ar">{l["ch"]}</span>' for l in C["alphabet"]["letters"])
    return f"""<div class="bm bm-letters">
        <div class="bm-hole"></div>
        <div class="bm-title">{e(m['title'])}</div>
        <div class="bm-sub">{e(m['sub'])}</div>
        <div class="bm-abc" dir="rtl">{letters}</div>
        {who}</div>"""


picks = "".join(f"""
      <div class="bm-card" data-id="{e(m['id'])}">
        {bookmark(m)}
        <button type="button" class="bm-pick" aria-pressed="false" data-id="{e(m['id'])}">Pick this one</button>
      </div>""" for m in C["bookmarks"])
bookmarks_page = f"""<header class="play-hero" id="top">
  {doodles(("star", "d-star", "top:28%;left:58%"), ("bee", "d-bee"))}
  <div class="inner">
    <div class="eyebrow">Kids' corner · Print at home</div>
    <h1>Make your own bookmarks</h1>
    <p class="lede">Pick your favourite friends, write your name, and ask a grown-up to print them. Then cut them out and keep your place in every story!</p>
  </div>
</header>
<section id="bm-app">
  <div class="inner">
    <div class="bm-bar">
      <label class="name-field" for="bm-name-input"><span>Your name</span>
        <input id="bm-name-input" type="text" maxlength="18" placeholder="For example: Amina" autocomplete="off"></label>
      <div class="bm-actions">
        <span class="bm-count" id="bm-count" aria-live="polite">Pick the bookmarks you like</span>
        <button type="button" class="btn btn-gold" id="bm-print">Print my bookmarks</button>
      </div>
    </div>
    <div class="bm-gallery" id="bm-gallery">{picks}
    </div>
    <div class="bm-tips">
      <h3>For grown-ups</h3>
      <ul>
        <li>Print on A4 paper, three bookmarks per page. Thick paper (200 g or more) works best.</li>
        <li>In the print window, choose "Portrait" and switch "Fit to page" off (scale 100%) so the bookmarks keep their size: 5 × 18 cm.</li>
        <li>Cut along the dotted lines. Punch the little circle and add a ribbon if you like.</li>
        <li>Nothing you type here is sent anywhere. The name is only used to print the bookmarks.</li>
      </ul>
    </div>
  </div>
</section>
"""
page("/bookmarks/", f"Printable bookmarks for kids · {SITE['series']}",
     "Free printable bookmarks with the Quran Animals, Malik, a Ramadan reading tracker and the Arabic alphabet. Pick, add a name and print.",
     bookmarks_page, "/play/", scripts='<script src="/assets/bookmarks.js" defer></script>\n')

# Alif Ba
AB = C["alphabet"]
ab_data = {"audio": AB["audio"], "letters": AB["letters"],
           "friends": {b["id"]: {"name": b["name"], "slug": b["slug"], "img": b["friend_img"]} for b in BOOKS}}
alphabet = f"""<header class="play-hero" id="top">
  {doodles(("star", "d-star", "top:30%;left:55%"), ("bee", "d-bee"))}
  <div class="inner">
    <div class="eyebrow">Kids' corner · Arabic letters</div>
    <h1>Alif Ba with the Quran Animals</h1>
    <p class="lede">Meet the 28 letters of the Arabic alphabet. See how each one looks, find it in a word with our animal friends, and trace it with your finger.</p>
    <div class="ab-progress" id="ab-progress" aria-live="polite"></div>
  </div>
</header>
<section id="ab-app">
  <div class="inner">
    <div class="ab-main">
      <div class="ab-card" id="ab-letter" aria-live="polite"></div>
      <div class="ab-card ab-trace" id="ab-trace">
        <p class="label">Trace the letter</p>
        <div class="ab-canvas-wrap">
          <canvas id="ab-canvas" aria-label="Tracing area. Draw the letter with your finger or mouse."></canvas>
          <div class="ab-burst" id="ab-burst" aria-hidden="true"></div>
        </div>
        <p class="ab-feedback" id="ab-feedback" aria-live="polite"></p>
        <div class="cta">
          <button type="button" class="btn btn-ghost" data-act="clear">Clear</button>
          <button type="button" class="btn btn-gold" data-act="next-letter">Next letter</button>
        </div>
      </div>
    </div>
    <h2 style="margin-top:48px">All 28 letters</h2>
    <p class="sec-intro">Arabic is read from right to left, so the alphabet starts at the top right. Tap a letter to learn it. A star means you traced it.</p>
    <div class="ab-grid" id="ab-grid" dir="rtl"></div>
    <div class="ab-tools"><span class="soon">Stars are saved on this device only.</span><span id="ab-reset"></span></div>
  </div>
</section>
<section class="band" id="find-letter">
  <div class="inner">
    <h2>Find the letter</h2>
    <p class="sec-intro">Read the name, then tap the right letter. Watch out for letters that look alike!</p>
    <div class="quiz" id="ab-game" aria-live="polite"></div>
  </div>
</section>
<script type="application/json" id="ab-data">{json.dumps(ab_data, ensure_ascii=False)}</script>
"""
page("/alphabet/", f"Alif Ba · Arabic alphabet for kids · {SITE['series']}",
     "Learn the Arabic alphabet with the Quran Animals: 28 letters, their forms, words with animal friends and finger tracing. Free for children.",
     alphabet, "/play/", scripts='<script src="/assets/alphabet.js" defer></script>\n')

# Ramadan
R = C["ramadan"]
friends = {b["id"]: {"name": b["name"], "slug": b["slug"], "ar": b["ar"], "tint": b["tint"], "tint_dark": b["tint_dark"]} for b in BOOKS}
ram_data = {"start": R["start"], "deeds": R["deeds"], "duas": R["duas"], "last_ten": R["last_ten_dua"], "friends": friends}
fd = R["iftar_dua"]
ramadan = f"""<header class="ram-hero" id="top">
  {doodles(("star", "d-star", "top:30px;left:6%"), ("star", "d-star", "top:60px;left:46%;width:18px;animation-delay:.8s"),
           ("star", "d-star", "bottom:50px;left:30%;width:20px;animation-delay:1.6s"), ("star", "d-star", "top:40px;right:28%;width:16px;animation-delay:2.2s"),
           ("bee", "d-bee", "bottom:24px;right:6%;width:80px"))}
  <div class="inner" style="position:relative;z-index:1">
    <div>
      <div class="eyebrow">Ramadan 1448 · for children</div>
      <h1>Ramadan with the Quran Animals</h1>
      <p class="lede">One good deed and one dua for every day of Ramadan. Tap “I did it!” after each good deed and watch Nur's honey jar fill up.</p>
      <span class="ram-count" id="ram-count"></span>
      <div class="ram-start"><label for="ram-start">Ramadan is expected to start {e(R['start_label'])}, depending on the moon sighting. Our Ramadan starts on:</label>
        <input type="date" id="ram-start"></div>
    </div>
    <div class="moon" aria-hidden="true"></div>
  </div>
</header>
<section id="ram-app">
  <div class="inner">
    <div class="ram-main">
      <div class="day-card" id="ram-day" aria-live="polite"></div>
      <div class="jar-card" id="ram-jar"></div>
    </div>
    <h2 style="margin-top:48px">All 30 days</h2>
    <p class="sec-intro">Tap a day to see its good deed and dua. A star means it's done.</p>
    <div class="ram-grid" id="ram-grid"></div>
    <p class="soon" style="margin-top:16px">Progress is saved on this device only.</p>
  </div>
  <script type="application/json" id="ram-data">{json.dumps(ram_data, ensure_ascii=False)}</script>
</section>
<section class="band pink">
  <div class="inner">
    <div class="iftar">
      <p class="label">Every evening</p>
      <h3>Dua for breaking the fast</h3>
      <p class="dua-ar" lang="ar" dir="rtl">{fd['ar']}</p>
      <p class="dua-tr">{e(fd['tr'])}</p>
      <p class="dua-en">“{e(fd['en'])}”</p>
      <p class="dua-ref">{e(fd['ref'])}</p>
    </div>
    <div class="more-grid" style="max-width:760px;margin-top:28px">{more_card(C["more_books"][0])}</div>
    <div class="signup" style="max-width:760px">
      <h3>A printable Ramadan activity book is coming</h3>
      <p>Get an email when new books and activity books are released.</p>
      <div class="cta"><a class="btn btn-gold" href="/#notify">Notify me</a></div>
    </div>
  </div>
</section>
"""
page("/ramadan/", f"Ramadan good deeds chart for kids · {SITE['series']}",
     "A free Ramadan chart for Muslim children: a good deed and a dua for each of the 30 days. Fill Nur the Bee's honey jar!",
     ramadan, "/ramadan/", scripts='<script src="/assets/ramadan.js" defer></script>\n')

# Legal notice and privacy policy (French law; French text is the reference, with an English summary)
L = C["legal"]
legal = f"""<header class="inner" id="top" style="padding-block:48px 8px">
  <div class="eyebrow">Mentions légales · Legal notice</div>
  <h1>Mentions légales</h1>
  <p class="lede">Informations légales sur le site liliianoor.com, conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN).</p>
</header>
<section style="padding-top:24px">
  <div class="inner prose">
    <h3>Éditeur du site</h3>
    <p>{e(L['name'])} {e(L['status'])} (entrepreneur individuel), autrice publiant sous le nom de plume « {e(L['pen_name'])} »<br>
      Adresse : {e(L['address'])}<br>
      SIRET : {e(L['siret'])}<br>
      E-mail : <span class="copy">{e(L['email'])}</span><br>
      Téléphone : {e(L['phone'])}<br>
      {e(L['vat'])}</p>
    <h3>Directrice de la publication</h3>
    <p>{e(L['name'])}</p>
    <h3>Hébergement</h3>
    <p>GitHub, Inc. (service GitHub Pages)<br>88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis<br>https://github.com</p>
    <h3>Propriété intellectuelle</h3>
    <p>Les textes, illustrations, couvertures et personnages de la série {e(SITE['series'])} sont la propriété de {e(L['pen_name'])}. Toute reproduction, totale ou partielle, sans autorisation écrite préalable est interdite.</p>
    <h3>Liens vers d'autres sites</h3>
    <p>Le site contient des liens vers Amazon et vers d'autres boutiques en ligne. Les achats effectués sur ces sites sont régis par leurs propres conditions de vente et politiques de confidentialité.</p>
    <h3>Données personnelles</h3>
    <p>Voir la <a href="/privacy/">politique de confidentialité</a>.</p>
    <p class="soon">Dernière mise à jour : {e(L['updated'])}</p>
    <hr>
    <h3>In English</h3>
    <p>This website is published by {e(L['name'])} {e(L['status'])}, a sole trader registered in France (SIRET {e(L['siret'])}), writing as {e(L['pen_name'])}. Address: {e(L['address'])}. Contact: {e(L['email'])}, {e(L['phone'])}. The site is hosted by GitHub, Inc. (GitHub Pages), San Francisco, USA. All texts and illustrations of the {e(SITE['series'])} series belong to {e(L['pen_name'])} and may not be copied without written permission.</p>
  </div>
</section>
"""
page("/legal/", f"Mentions légales · {SITE['series']}", f"Legal notice for liliianoor.com, the website of the {SITE['series']} series by {SITE['author']}.", legal, "")

privacy = f"""<header class="inner" id="top" style="padding-block:48px 8px">
  <div class="eyebrow">Politique de confidentialité · Privacy policy</div>
  <h1>Politique de confidentialité</h1>
  <p class="lede">Ce site collecte le moins de données possible. Les jeux, la page Ramadan et la boutique ne nous transmettent aucune donnée personnelle.</p>
</header>
<section style="padding-top:24px">
  <div class="inner prose">
    <h3>Responsable du traitement</h3>
    <p>{e(L['name'])} {e(L['status'])}, {e(L['address'])}. Contact : <span class="copy">{e(L['email'])}</span></p>

    <h3>Inscription aux nouveautés</h3>
    <p>Si vous laissez votre adresse e-mail dans le formulaire « Notify me », nous l'utilisons uniquement pour vous informer de la sortie de nouveaux livres et cahiers d'activités.</p>
    <ul>
      <li><b>Base légale :</b> votre consentement (article 6.1.a du RGPD).</li>
      <li><b>Prestataire :</b> le formulaire est traité par Formspree, Inc. (États-Unis). Vos données peuvent donc être transférées hors de l'Union européenne.</li>
      <li><b>Durée de conservation :</b> jusqu'à votre désinscription.</li>
      <li><b>Désinscription :</b> à tout moment, par simple e-mail à {e(L['email'])} ou via le lien présent dans nos e-mails.</li>
    </ul>

    <h3>Jeux, quiz et calendrier du Ramadan</h3>
    <p>Les jeux et le calendrier des bonnes actions enregistrent leur progression (par exemple le prénom saisi et les jours cochés) uniquement dans le navigateur de votre appareil (stockage local). Ces informations ne nous sont jamais envoyées. Vous pouvez les effacer à tout moment en vidant les données du site dans votre navigateur. Aucune donnée n'est demandée aux enfants.</p>

    <h3>Cookies et statistiques</h3>
    <p>Ce site n'utilise ni cookies publicitaires, ni outils de mesure d'audience, ni publicité. Les polices de caractères sont hébergées sur ce site et ne font appel à aucun service tiers.</p>

    <h3>Hébergement</h3>
    <p>Le site est hébergé par GitHub, Inc. (GitHub Pages), qui peut enregistrer des données techniques de connexion, comme l'adresse IP, pour assurer la sécurité du service. Voir la politique de confidentialité de GitHub.</p>

    <h3>Achats</h3>
    <p>Les achats se font sur Amazon ou sur notre boutique en ligne. Les données de commande et de paiement sont traitées par ces plateformes selon leurs propres politiques de confidentialité.</p>

    <h3>Vos droits</h3>
    <p>Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité de vos données, ainsi que du droit de retirer votre consentement à tout moment. Pour les exercer, écrivez à {e(L['email'])}. Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).</p>
    <p class="soon">Dernière mise à jour : {e(L['updated'])}</p>
    <hr>
    <h3>In English</h3>
    <p>We collect as little as possible. If you sign up for new-book news, we use your email only for that, with your consent; the form is processed by Formspree, Inc. (USA), and you can unsubscribe at any time by writing to {e(L['email'])}. The games and the Ramadan chart save progress only in your own browser and never send it to us. There are no advertising cookies, no analytics and no ads, and the fonts are hosted on this site. The site is hosted by GitHub Pages. Purchases on Amazon or our shop are handled under those platforms' own policies. You can ask us to access, correct or delete your data at any time, and you may complain to the French data authority, the CNIL.</p>
  </div>
</section>
"""
page("/privacy/", f"Privacy policy · {SITE['series']}", f"Privacy policy for liliianoor.com: what data the {SITE['series']} website collects and why.", privacy, "")

# 404
page("/404.html", f"Page not found · {SITE['series']}", SITE["seo"], f"""<header class="inner" id="top" style="padding-block:72px">
  <div class="eyebrow">404</div>
  <h1>This page flew away</h1>
  <p class="lede">Like Hudhud on a mission. Let's go back to the books.</p>
  <div class="cta"><a class="btn btn-gold" href="/books/">See all books</a><a class="btn btn-ghost" href="/">Home</a></div>
</header>
""", "")

# sitemap + robots
urls = ["/", "/books/", "/play/", "/alphabet/", "/bookmarks/", "/ramadan/", "/shop/", "/legal/", "/privacy/"] + [f"/books/{b['slug']}/" for b in BOOKS]
(ROOT / "sitemap.xml").write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + "".join(f"  <url><loc>{SITE['domain']}{u}</loc></url>\n" for u in urls) + "</urlset>\n", encoding="utf-8")
(ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {SITE['domain']}/sitemap.xml\n", encoding="utf-8")

print(f"Built {len(urls)} pages + 404")
