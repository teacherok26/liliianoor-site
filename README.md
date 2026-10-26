# liliianoor.com

Website for the **Quran Animals** picture-book series by Liliia Noor.

## How it works

All texts, links and prices live in **`content.json`**. After changing it, run:

    python3 build.py

This regenerates the pages:

| Page | File |
|---|---|
| Home | `index.html` |
| All books | `books/index.html` |
| One page per book | `books/<slug>/index.html` |
| Shop + shipping calculator | `shop/index.html` |

Plus `/play/`, `/ramadan/`, `/legal/` (mentions légales), `/privacy/`, `404.html`, `sitemap.xml` and `robots.txt`. Legal details live in `legal` in `content.json`.

- `assets/` — shared styles and scripts (quiz, shipping calculator, memory game, Ramadan chart, Alif Ba); `assets/fonts/` self-hosted fonts.
- `img/` — book covers; `img/gallery/` children's drawings; `img/activity/` activity book covers.

## Things to fill in `content.json`

- `amazon` / `print` on each book, `amazon_series`, `payhip_shop` — shop links.
- `book_price`, `bundles` (max 5% off in France, loi Lang), `shipping.zones` — prices (keep shipping the same as in Payhip).
- `signup_form` — form endpoint for new-book notifications (e.g. Formspree).
- `contact`, `gallery`, `activity_books`.
