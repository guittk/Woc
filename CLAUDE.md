# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

WOC Estofados — a static marketing site + lead-capture form + admin panel for an upholstery
(estofados) business, deployed via GitHub Pages (see `CNAME`) at `woc.guilherme-oliveira.com`.
There is no build step, no bundler, no package manager and no test suite — it's plain HTML/CSS/JS
served as-is, backed by Firebase (Realtime Database + Authentication) for persistence.

## Commands

There is no `package.json` / build tooling. To work on the site locally, just serve the folder
statically and open it in a browser (opening via `file://` breaks Firebase and fetch-based flows):

```bash
python -m http.server 8000
```

Then browse to `http://localhost:8000/index.html`, `/orcamento.html`, or `/admin.html`.
There is no linter and no automated test suite — verify changes by loading the pages in a browser
and checking the console.

## Pages

- `index.html` — the public marketing site (hero, serviços, portfólio, sobre, depoimentos, CTA).
- `orcamento.html` — public quote-request form (customer uploads photos + describes the job).
- `admin.html` — password-gated internal panel: view/respond to quote requests, and edit the
  site's Serviços/Portfólio content. Not linked from search engines (`robots: noindex,nofollow`)
  but has no server-side protection — access control is entirely Firebase Auth + DB rules.

Each page loads its own CSS (`css/style.css` is shared/base; `css/orcamento.css` and
`css/admin.css` are page-specific additions) and its own JS entry point (`js/script.js`,
`js/orcamento.js`, `js/admin.js`). `js/firebase-init.js` and `js/theme.js` are shared includes.

## Firebase architecture

Config lives in `js/firebase-init.js` (project `wocestofados`), which exposes two globals used
everywhere else: `wocDb` (Realtime Database) and `wocAuth` (Auth — only loaded on pages that
include the `firebase-auth-compat.js` script tag; `index.html` only needs the database).

Realtime Database has two top-level nodes:

- `orcamentos/{pushId}` — quote requests submitted from `orcamento.html`
  (`nome`, `telefone`, `tipo`, `situacao`, `necessidade`, `fotos[]` as compressed base64 data
  URLs, `status`: `'novo' | 'respondido'`, `data` ISO timestamp). Public **create**, admin-only
  **read/update/delete** (see rules below).
- `siteConfig/servicos/{pushId}` — the single source of truth for both the "O que fazemos"
  marketing cards and the "Trabalhos realizados" portfolio grid on `index.html` (see Content
  model below). Public **read**, admin-only **write**.
- `siteConfig/settings` — `{ minAntesDepois, minGaleria }`, the minimum number of before/after
  and gallery-type portfolio cards the public site should always show (defaults 3 and 6 — see
  Content model below). Public **read**, admin-only **write**.

Expected Realtime Database rules (not stored in the repo — configure in the Firebase console):

```json
{
  "rules": {
    "orcamentos": {
      ".read": "auth != null",
      "$id": { ".write": "auth != null || !data.exists()" }
    },
    "siteConfig": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

Admin login is Firebase email/password auth (`wocAuth.signInWithEmailAndPassword`), managed
under Authentication → Users in the Firebase console — there's no self-service signup anywhere.

## Content model: Serviços double as Portfólio

There is no separate "categories" or "portfolio" collection. Everything is one flat list at
`siteConfig/servicos`, and each entry's role on the page is inferred from its fields:

- Entry **without** a `tipo` → rendered only as a plain marketing card in "O que fazemos"
  (`icon`, `titulo`, `texto`).
- Entry **with** `tipo: 'galeria'` → also rendered as a portfolio card with a photo carousel
  (`fotos: [dataURL, ...]`).
- Entry **with** `tipo: 'antes_depois'` → also rendered as a portfolio card that opens a
  drag-to-compare slider in the lightbox (`antes`, `depois` data URLs, optional `nota`).
- `categoria` (e.g. `"Sofás"`) drives the dynamic filter buttons on the portfolio grid — buttons
  are derived from whatever distinct `categoria` values exist among entries that have a `tipo`.
  Admin picks it from a `<select>` sourced from `siteConfig/categorias/{pushId}: { label }`
  (managed in its own "Categorias" admin block), but the value actually stored on the serviço is
  the label string itself, not the categoria's push id — editing/deleting a categoria later
  doesn't retroactively touch servicos that already reference its old label.
- `antes_depois` cards render an actual draggable compare slider inline in the portfolio grid
  (not just a static thumbnail) — dragging works right there without opening the lightbox first;
  a small maximize button (`.p-maximize`) opens the full lightbox version. See `wireCompareDrag()`
  in `js/script.js`, which uses Pointer Events + `setPointerCapture` (shared by both the card
  slider and the lightbox slider) instead of window-level mouse/touch listeners, so nothing leaks
  across re-renders.
- Portfolio ordering always puts `antes_depois` entries before `galeria` entries
  (see `renderPortfolio()` in `js/script.js`).

`js/script.js` ships a hardcoded `defaultServicos` array so the site renders immediately and
still works if Firebase is unreachable/empty; it then does a one-time `once('value')` fetch of
`siteConfig` (servicos + settings) and, if `servicos` is non-empty, re-renders everything with
the remote data (no realtime listener on the public site — admin changes need a page reload to
show up).

**Minimum portfolio count / auto-padding**: `buildPortfolioList()` in `js/script.js` never lets
"Trabalhos realizados" look empty. It splits real (`tipo`-carrying) entries into `antes_depois`
and `galeria`, and if either group is short of `siteConfig/settings` (`minAntesDepois: 3`,
`minGaleria: 6` by default), it tops the group up with synthetic entries from `PLACEHOLDER_POOL`
(via `makePlaceholderItem()`) — furniture-titled filler using the LoremFlickr placeholder photos
described below, always tagged `placeholder: true` and rendered with an "Exemplo" badge so
they're never mistaken for real client work. These synthetic entries are render-only — never
written to Firebase.

`js/admin.js` is the CRUD side: realtime listeners (`on('value')`) on `siteConfig/servicos` and
`siteConfig/settings`, one-time seeds (`SEED_SERVICOS`, `SEED_SETTINGS`) written only if those
nodes don't exist yet. The Configurações tab groups entries into three lists — "O que fazemos"
(no `tipo`), "Antes/Depois", and "Galeria de trabalhos" — each with its own "+ Adicionar" button.
Create/edit always happens in the shared modal (`#formModalOverlay` / `openFormModal(context,
existing)`, where `context` is `'servico' | 'antes_depois' | 'galeria'` and controls which fields
the modal shows); delete always goes through the confirmation modal (`#confirmModalOverlay` /
`openConfirmModal(message, onConfirm)`) instead of `window.confirm`. Photo uploads (both here and
in `orcamento.js`) are resized client-side to compressed JPEG data URLs via a shared
`resizeImage()` helper (canvas-based) before being written to the database — there is no Firebase
Storage usage anywhere, images are stored inline as base64 strings.

Placeholder/demo images (both the auto-padding above and any portfolio entry missing a real
photo) come from LoremFlickr, keyed by a keyword derived from `categoria`/`icon` (see
`keywordFor()` / `furniturePhoto()` in `js/script.js`) with a deterministic `lock` hash per item
so the same entry always shows the same placeholder photo instead of a random one on every reload.

## Theming

Light/dark mode is a `data-theme="light"|"dark"` attribute on `<html>`, toggled by
`js/theme.js` and persisted to `localStorage` (`wocTheme`), with `prefers-color-scheme` as the
fallback when no explicit choice is stored. Every page has a small inline script in `<head>`
that applies the stored theme before paint (avoids a flash of the wrong theme) — if you add a
new page, copy that inline snippet and include `js/theme.js` + a `#themeToggle` button.

All colors are CSS custom properties in `css/style.css` (`:root` for light, `:root[data-theme=
"dark"]` + a matching `prefers-color-scheme: dark` block for dark). Two variables matter most
when styling something new: `--ink` (adaptive text/foreground color — use this for anything that
must stay readable in both themes) vs `--charcoal`/`--white` (intentionally **fixed**, not
theme-adaptive — used for permanently-dark decorative blocks like the footer, `.btn-primary`,
and `.diff-card` that are meant to look the same in both themes). Getting this distinction
backwards is the easiest way to accidentally make text invisible in dark mode.
