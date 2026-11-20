# Tetun

A phone-friendly phrasebook and practice game for everyday Tetun, the national language of Timor-Leste. Once it has loaded it keeps working without a signal.

## Why it exists

Before taking my two sons to Timor-Leste for a motorcycle holiday, I wanted enough Tetun to greet people, ask for directions and apologise politely when we inevitably got lost. Phrasebooks are fine at a desk but not much use when the words need to come out of your mouth unprompted, so I built a game to drill them in before we left.

## How it works

The vocabulary is grouped into 12 topics and 33 lessons, with 330 Tetun and English word pairs in all:

- Hasee malu (Greetings)
- Lisensa! (Excuse me)
- Aprende (Learning)
- Ita halo saida? (What are you doing?)
- Bainhira? (When?)
- Númeru ho oras (Numbers and time)
- Eskola (School)
- Hatudu dalan (Giving directions)
- Uma kain (Household)
- Halo planu (Making plans)
- Atividade loro-loron nian (Daily activities)
- Ita haan lai! (Let's eat!)

**Phrasebook.** Search in Tetun or English, with or without accents and capitals, or browse by topic. Tap a word for a large view, with a link to report a mistake.

**Practise.** Each lesson is a tap-to-match game: tap a word, then its match. The first round shows one pair and every round after that adds another until the whole lesson is on the table. The direction flips each round, Tetun to English and then English to Tetun. Correct matches fill the progress bar and a wrong tap costs a point. Your best result for each lesson is saved on your phone, and words you keep getting wrong are collected under "Words I keep missing".

## Running it

It uses ES modules and a service worker, so it has to be served over HTTP; opening `index.html` straight from disk will not work. There is no build step.

```bash
git clone https://github.com/botheredbybees/tetun.git
cd tetun
python3 -m http.server 8000   # then browse to http://localhost:8000
```

Visit it once while online and it is cached for offline use. When a new version is released a banner offers to reload into it. Service workers need HTTPS, except on `localhost`.

## Tests

```bash
npm test
```

This uses Node's built-in test runner (Node 18 or newer) and has no dependencies. It covers the data file, search, game rules, saved progress and the offline file list. The screens and the service worker are checked by hand in a browser.

## Data

The word lists live in `content/words.json`: `topics`, `lessons` and `entries`. To add a word, append an entry with the next id (`w331`), its `topic` and its `lesson` number, then run `npm test`. The `data/` folder holds the source material the lists were built from.

## Built with

Plain HTML, CSS and JavaScript (ES modules), a service worker and a web app manifest. No frameworks and no dependencies.

## A note on accuracy and credit

These lists were put together by a learner, for a learner. Corrections from Tetun speakers are very welcome, so please open an issue or a pull request, or use "Report a mistake" in the app.

The words come from the Tetun-English interactive dictionary by Catharina Williams-van Klinken, © Dili Institute of Technology. The licence for the word data has not yet been agreed with its author, so until it is, please do not treat the word list as free to reuse.
