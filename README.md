# Tetun

A small browser game for learning everyday Tetun, the national language of Timor-Leste.

## Why it exists

Before taking my two sons to Timor-Leste for a motorcycle holiday, I wanted enough Tetun to greet people, ask for directions and apologise politely when we inevitably got lost. Phrasebooks are fine at a desk but not much use when the words need to come out of your mouth unprompted, so I built a game to drill them in before we left.

## How it works

The vocabulary is grouped into 11 topics and 31 lessons, with 330 Tetun and English word pairs in all:

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

Each lesson is a drag-and-drop matching game. The first round shows a single pair, and every round after that adds another until ten are on the table. The direction flips each round, Tetun to English and then English to Tetun, so you learn to recognise a word and to produce it. Correct matches fill a progress bar and wrong drops cost a point, and your progress through each lesson is saved in a browser cookie so you can pick up where you left off.

## Running it

There is no build step or server code. Clone the repository and open `index.html` in a browser, or serve the folder from any static web host.

```bash
git clone https://github.com/botheredbybees/tetun.git
cd tetun
python3 -m http.server 8000   # then browse to http://localhost:8000
```

## Built with

- HTML, CSS and JavaScript
- jQuery and jQuery UI for the drag-and-drop cards
- Bootstrap for layout and modal dialogues
- jquery.cookie for saving progress

## Data

The word lists live in `js/main.js` as the `CueCards` array, with one sub-array per lesson. Adding a lesson means adding another block of word pairs there and an entry in the `units` and `topics` arrays. The `data/` folder holds the source material the lists were built from, including a Tetun to English lexicon and CSV exports.

## A note on accuracy

These lists were put together by a learner, for a learner. Corrections from Tetun speakers are very welcome, so please open an issue or a pull request.
