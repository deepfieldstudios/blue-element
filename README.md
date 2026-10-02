# 2026-BlueElement — website

Built by Deep Field. Live: https://blueelementstore.com

- **Host:** GitHub Pages (`main` branch, root) under the Deep Field org
- **Domain:** blueelementstore.com (Namecheap; apex A-records + `www` CNAME → Pages)

## Deploy
Push to `main` → Pages auto-deploys. `CNAME` pins the domain; `.nojekyll` keeps folders intact.

## Local preview
```
python3 -m http.server 8000   # http://localhost:8000
```

See ../../../_CLIENT_TEMPLATE/04_Build/DEPLOY.md for the full go-live checklist.

---

## Build knowledge, decisions and gotchas (consolidated 23 Sep 2026)

Durable build knowledge for this repo, consolidated out of Deep Field's working notes so it
lives with the code. Dates are when the decision/change was made, not when it was written here.

### Repo, host and accounts

- **Repo:** `github.com/deepfieldstudios/blue-element` — **PUBLIC**, in the `deepfieldstudios`
  GitHub org.
- **GitHub account used:** `harryomccahill` (user id **84209257**).
- **Commit email:** the GitHub noreply address
  `84209257+harryomccahill@users.noreply.github.com`, set at repo init. This was set deliberately
  because of the Sambacam deploy gotcha (a personal email on commits leaking into a public repo).
- **Local repo root:** `~/Desktop/Deep Field/03_Clients/2026-BlueElement/04_Build/site/` — that
  folder **is** the git root. This is the Deep Field client convention: the deployable site is the
  repo root, and everything non-deployable sits one level up in `04_Build/`.
- **Host:** GitHub Pages, `main` branch / root, with `.nojekyll` and `CNAME`. Pages builds clean.
- This is Blue Element site **2.0**. The old WordPress site at `blueelementfreediving.com` is a
  separate, untouched property.

### Domain, DNS and HTTPS

- **Domain:** `blueelementstore.com`, registered at **Namecheap**.
- **DNS (done):** apex **A** records → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
  `185.199.111.153`; **`www` CNAME** → `deepfieldstudios.github.io.` No CAA record, no AAAA
  records.
- **LIVE with HTTPS enforced since 2026-08-04** — valid cert; https apex, https www and the
  http→https redirect were all verified (200 / ssl-ok).
- **Why this domain and not `blueelementfreediving.com`:** a deliberate **soft launch**. The old
  WordPress site stays live until the Blue Element partners green-light the new one;
  `blueelementstore.com` is the URL shared with them for review. The name reads like a shop but
  hosts the whole school/competition site.

#### Cert gotcha (reusable across any GitHub Pages client site)

The GitHub Pages TLS cert stalled for about **2 hours at `state:None`** even though DNS was
already correct. The fix that worked was to **toggle the custom domain off, then on**:

1. Delete the `CNAME` file, commit, push, wait for the Pages build.
2. Re-add `CNAME`, commit, push.

The cert then went `None` → `issued` → `approved` inside one rebuild. Then enforce HTTPS:

```
gh api -X PUT repos/OWNER/REPO/pages -F https_enforced=true
```

Two throwaway commits from this dance are in history: `a3027af` (remove CNAME) and `909369e`
(restore CNAME). Leave them.

### Source design project and stack

- **Source:** the Claude Design project **"Blue Element Design System"**, projectId
  `2a1be26d-bf78-44e7-9910-c6b557a5cb0a`.
- Unlike the DWA and Freeflow Dynamics sites, this is **NOT a React preview build**. The pages are
  **plain static HTML/CSS/JS**. No prerender step, no hydration hardening, no build pipeline —
  edit the HTML directly.
- Runtime pieces: `site.css` (styles), `chrome.js` (injects the shared header and footer),
  `image-slot.js`, `pages.js`, `shop-links.js`.
- Because it is production-shaped already, iteration happens **directly in the repo** (via cmux /
  Claude Code) rather than back in the design suite.

### Staging / flattening recipe (2026-08-01)

How the design export became this repo — repeat this if the design project is ever re-exported:

- Export the design project as a **ZIP** (`Blue_Element_site_V2.0.zip`). The ZIP is **required**:
  DesignSync's `get_file` truncates any image over **256 KiB** (`truncated:true`) — the same cap
  that bit the DWA build.
- Flatten `site/*` to the repo root. Home page `Blue Element Home.html` → `index.html`.
- Rewrite references across HTML/JS/CSS: `../assets/` → `assets/`, and
  `Blue Element Home.html` → `index.html`.
- Move the design-system CSS to `assets/ds/styles.css` (plus `assets/ds/tokens/*`) and repoint
  `site.css`'s `@import`.
- Drop from the export: the `uploads/` folder, the `_ds` bundle + manifest, and the boot
  `index.html`.
- Result at the time: **53 optimised photos** in `assets/media/clean/` and **8 brand logos** in
  `assets/logo/`.
- Smoke test after flattening: every page and every referenced asset returns 200, zero broken
  links (15 pages passed at staging).

### Pages

Original page set: `index` (home), `about`, `athletes` plus `athlete-harry`, `athlete-arron`,
`athlete-kathleen`, `athlete-natalie`, `courses`, `training`, `camps`, `competition`, `calendar`,
`dominica`, `gallery`, `sponsorship`. Later additions: `book.html` (shop),
`november-2026.html` (gated event pack), `onboarding.html` (+ `onboarding.js`). The repo has since
grown further pages (event pages, `plan-your-trip`, `host-with-us`, `enquire`, `privacy`, `404`).

- **Contact** was originally a `mailto:` to `blueelementfreediving@gmail.com`. The header and
  mobile **"Book Now"** buttons were repointed from that mailto to `book.html` when the shop
  shipped (2026-08-16).
- The home page competition countdown targets **2026-11-10T09:00-04:00** (the "first official top"
  day — left at Nov 10, which is inside the event window; see open items).

### Design, layout and content rules

- **Governing principle (from Harry, 2026-08-16): "less verbiage, more image/video."** The new
  site should match the OLD WordPress site's cleaner, more-visual / less-text layout. Keep
  applying this to subpages.
- Homepage hero = the **Sofia baitball shot** (`sofia-baitball.jpg`), which was the old site's
  hero. The over-under split shot (`hero-split.jpg`) was moved to the **courses** hero.
- A **video section** ("See it for yourself") sits after the pillars, YouTube id **`bFW1rPO8Hxg`**.
- The beat-strip under the hero is a **solid teal block**, no image.
- Text was trimmed hard: pillars intro, conditions paragraph (stats kept), team bios reduced to a
  role-line credential + one line + link, and the competition / Dominica / gallery leads.
- Hero contrast and crop tuned via `object-position`, a scrim, and a sky-blue eyebrow.
- **Nav is left as-is** — Harry's explicit call, do not restructure it.
- **Freedive quick-nav band**: a strip linking Courses / Training / Camps / Calendar, one blue-teal
  shade each, the current page ringed. Classes `.freedive-nav` / `.fdn` in `site.css`. Repeated at
  the top of all four "Freedive With Us" pages.
- Course cards and camp rows are **fully clickable** via `data-buy`.
- Fixed a real bug: invisible white text in the courses "Find your level" table.
- **Visibility figure is 20–30 m** site-wide (corrected from an earlier number). Deepest-dive stat
  is **130 m** (was 100 m).
- **Image de-duplication policy (2026-08-18b):** each photo is used **once** as a functional card
  or section element. Exceptions allowed to reshow: **heroes, athlete portraits, and the gallery +
  homepage "media mosaic"**. 12 swaps were made to bring in fresh imagery.
- **Competition card athletes are deliberately mixed** (they were too Katerina-heavy): team
  flagship + Sebastián Lira (Invitational, `lira-deep`) + William Trubridge (March Mini,
  `wtrubridge`) + one Katerina (May).
- **Home page "Discover Dominica" scenery section** (`dominica-aerial`, `scotts-head-village`,
  `emerald-pool`, `soufriere-boats`) and an **"Island partners" logo strip** (Discover Dominica /
  DWA / Dominica Tourism / Jungle Bay / Coulibri). These were flagged to Harry as keep-or-trim.
  Some partner logos were originally hotlinked and Tourism + Jungle Bay were empty slots — **all 5
  island-partner logos are now self-hosted** under `assets/logo/partners/`.
- **Agency logos**: AIDA and Molchanovs, self-hosted in `assets/logo/agencies/`, in an
  "Internationally certified through" strip on `courses.html`. The AIDA SVG was **recoloured navy**
  to work on a light background.

### Images and photo sources

- **Photo optimisation recipe:** `sips -Z 2400` then `sips -s formatOptions 72`, output into
  `assets/media/clean/`.
- **Local originals** (for future swaps — not needed to deploy, since the ZIP carried the optimised
  set): `~/Desktop/Blue Element HQ/90_MEDIA & MARKETING/Website/`
  - `Completed/` — 135 full-res freediving originals; filenames match the design's
    `assets/media/*.JPG`, and this is where the **named-athlete photos** live (Trubridge, Lira,
    Pedro Tapia, Matt Malina, etc.). No confirmed solo Alexey Molchanov shot was found.
  - `website ready VB 2025/` — 68 Daan Verhoeven "harry-" portraits.
  - Dominica scenery and partner-logo files do **not** exist locally; they came only from the
    design export.
- **Old WordPress site media:** all **87 photos** were ripped from the old site into
  `02_Content-From-Client/old-site-media/` (web-sized). Includes `comp-legacy.jpg`, used for the
  "A decade in the deep" photo on the competition page.
- **Katerina Sadurska Nov-2025 WR photos:** 57-shot source folder at
  `~/Desktop/Blue Element HQ/40_COMPETITIONS/Events by Year/2025/NOV 25/Allie Reilly KATE SADURSKA WR/`
  — huge 6720 px originals. `40_COMPETITIONS` also holds 177 competition photos including
  `Events by Year/2024`.

### Season, events and prices

**Season is 2026/27** site-wide (Nov 2026, March + May 2027). Four competitions, used as the
`data-buy` catalog ids:

| Event | id | Status | Price | Cap |
|---|---|---|---|---|
| Nov AIDA | `comp-nov-aida` | WR | $850 | 44 |
| Nov CMAS Invitational | `comp-nov-cmas` | NR | $600 | 12 |
| March Mini AIDA | `comp-mar-aida` | NR | $600 | 20 |
| May Open (CMAS & AIDA) | `comp-may-open` | WR | $850 | 30 |

- Nov CMAS and March Mini were raised **$500 → $600 on 2026-08-22**.
- The **competition page lists these four season events as clickable registration cards** (it used
  to list the four disciplines). `book.html#competitions` lists all four too.
- Competition dates moved **Nov 7–15 → Nov 8–17** across all pages and the footer.
- Course prices: Try **$150 → $175**; Freediver **$395 → $450**. Specialist cards added: Vertical
  Blue Safety **$450**, No Limits Session **$150**, AIDA Instructor **$1500**, Advanced EQ Clinic
  **$150**.
- Camps: BE Camp `camp-week` **$725, cap 12**; Matt Hill retreat `retreat-matt-hill` **$750**.
- Training passes: autonomous day/week/month **$35 / $125 / $375**; elite day/month **$75 / $675**.
  Private coaching **from $95**. Courses are **unlimited** (no cap).
- Pricing reconciliation rule used when merging the old WordPress `courses-training` page into the
  new catalog: **higher price wins**.
- `book.html` shows 3 sections (Courses & Coaching, Competitions, Training) with all 14 products
  and their prices; the comps show remaining spots (AIDA 44 / CMAS 12).

### Commerce architecture (decisions)

- **Stripe-direct, NO Shopify.** Shopify Payments is not available in Dominica and is the wrong fit
  for services.
- **Phased approach:** Payment-Links MVP first (redemption caps are the hard oversell guard), then
  a full **Cloudflare Worker + Stripe Checkout** build in a separate **PRIVATE** repo
  `deepfieldstudios/blue-element-commerce` (KV inventory cache; Stripe is the source of truth for
  paid counts; webhook → Resend). Full fulfilment = receipt + what-to-bring + waiver PDF +
  Calendly. The site stays static; the Worker is called cross-origin, CORS-locked, with no DNS
  change.
- **Design rule:** the **Stripe redemption limit is the hard cap**; the site's "X spots left" is a
  soft display only.
- Plan, build prompt and the final catalog live in `04_Build/COMMERCE_PLAN.md`.
- **Stripe account (confirmed 2026-08-09/10):** legal entity is **UK** (Stripe is unsupported in
  Dominica), trading name "Blue Element Freediving", statement descriptor `BLUE ELEMENT`, pricing
  in **USD**. A Stripe **Organisation "Blue Element"** (`org_6VCJRbG9E9qCuubBtRaoIoy`) exists under
  the login `harry.mccahill@gmail.com` (which also carries personal "Buy Me a Coffee" and "Synergy
  Diving" accounts; test mode is reached via "Switch to sandbox").
- **ONE Blue Element account** takes competitions, courses, camps, coaching, training and guest
  fees. Separate product lines are handled by product catalogue / metadata, **not** separate
  accounts.
- **Streamlined 2026-08-10:** the proposed separate "Special Projects" account was dropped, and so
  was **Stripe Connect**. **Guest-instructor camps = Model A** — the guest instructor collects from
  their own clients and pays Blue Element a facility fee **through** the Blue Element Stripe
  (fixed fee → Payment Link; variable → Stripe Invoice). No connected accounts, no splits. This
  means the Phase-1 Worker needs no Connect, making it a lighter build. The Org is kept but is
  optional.
- **Checkout field decisions (2026-08-22):** competition checkout collects **name + email only**
  (Stripe default fields, no custom fields). **Private coaching stays an email enquiry** — variable
  price, no Stripe link. Capped items use Stripe's **redemption limit = cap**.
- **Matt Hill retreat = ONE shared Payment Link** across both March weeks (Harry's call), with a
  Stripe "which week?" dropdown and a cap equal to the combined total.
- Checklist for creating the links: `04_Build/PAYMENT_LINKS_CHECKLIST.md`.

### `shop-links.js` — the single source of checkout wiring

All checkout wiring lives in **one file**, `shop-links.js`, loaded on `book.html`,
`courses.html`, `camps.html` and `competition.html`. It exposes a `window.STRIPE_LINKS` map keyed
by catalog id, and wires **any** element carrying `[data-buy="<id>"]`:

1. the real Stripe URL if set, else
2. the element's `data-fallback` URL, else
3. an "Enquire" `mailto:`.

Catalog keys: `course-try`, `course-freediver`, `course-advanced`, `course-master`,
`course-vb-safety`, `course-nolimits`, `course-instructor`, `eq-clinic`, `coaching-private`,
`comp-nov-aida`, `comp-nov-cmas`, `comp-mar-aida`, `comp-may-open`, `train-auto-day`,
`train-auto-week`, `train-auto-month`, `train-elite-day`, `train-elite-month`, plus `camp-week`
and `retreat-matt-hill`.

**PAYMENTS WENT LIVE 2026-08-22.** All **14** live Stripe Payment Links are wired in (4 comps +
8 courses + 2 camps) and were verified in-browser routing to Stripe from `book.html`,
`competition.html` and `camps.html`. URLs are `book.stripe.com` or `buy.stripe.com` (no `test_`),
with a redemption limit on each capped item. **Deliberately unwired:** `coaching-private`
(enquire only) and the five `train-*` passes.

A multi-item cart is explicitly deferred to the Phase-1 Worker.

### `november-2026.html` — gated event pack (live since 2026-08-25)

A web version of the client's Canva prospectus PDF ("Blue Element November 2026", 7 slides, sent
via WhatsApp).

- Source PDF was **34 MB**; compressed with `gs -dPDFSETTINGS=/ebook` to **1.9 MB** and stored at
  `assets/docs/blue-element-november-2026.pdf`.
- Page structure: hero + always-visible teaser highlights, then an **email-capture gate**. On
  submit it unlocks the full pack inline (packages / itinerary / safety / records / travel),
  reveals the live `comp-nov-aida` **$850** Stripe button, and offers the PDF download.
- The unlock **persists via `localStorage`** and honours a **`#unlocked` hash**, so an emailed link
  can bypass the gate.
- Featured via a banner at the top of `book.html`.
- **Email backend = MailerLite** (Harry's pick over Mailchimp: MailerLite's free plan includes the
  welcome automation, Mailchimp's does not). The form does a `mode:'no-cors'` POST. Config
  constants `LEAD.endpoint` / `LEAD.emailField` / `LEAD.extra` with step-by-step notes are at the
  **bottom of `november-2026.html`**.
- **Pricing note:** only the **$850 regular entry** has a Stripe link. Early-bird ($750) is closed,
  and the +1-month-training tiers ($1000 / $1100) are enquire-only.
- Event details taken from the PDF: **Nov 8–17**, **145 m limit**, **6 dive days**, photopacks
  **$250** (event) / **$60/day**, contact WhatsApp **+44 7554 739347**.

### `onboarding.html` — arrival / onboarding form (built 17 Sep 2026, live 19 Sep)

- Purpose: one arrival questionnaire for camp guests, course students and training athletes.
- **Exactly seven fields, by Harry's explicit instruction** (a longer brainstorm was rejected):
  **name, email, arrival date, what they signed up for (dropdown), insured, highest certificate,
  recent PBs (last 3 months)**. Keep it at seven answers unless Harry asks for more.
- Files: `onboarding.html` + `onboarding.js`. Same delivery pattern as `comp-interest.js`:
  `ENDPOINT` empty → `mailto:` fallback; set it to
  `https://formsubmit.co/ajax/blueelementfreediving@gmail.com` (needs one confirmation click) or a
  Formspree URL to post silently.
- Supports **`?for=<value>` prefill** so Stripe Payment Link success URLs can preselect the
  product. Dropdown values: `comp-nov-2026`, `comp-march-mini-2027`, `comp-may-open-2027`,
  `camp-depth-dec-2026`, `camp-other`, `course-try`, `course-freediver`, `course-advanced`,
  `course-master`, `course-safety`, `course-instructor`, `train-autonomous`, `train-elite`,
  `train-coaching`.
- Marked **`noindex`**.
- **How to use it:** when someone books, send them
  `blueelementstore.com/onboarding.html?for=<product>`.
- Status: committed and pushed (`bd885bc` + a follow-up endpoint commit); `ENDPOINT` is set to
  FormSubmit, but **the one-time FormSubmit confirmation email to
  `blueelementfreediving@gmail.com` still needs clicking after the first real submission**.
- Longer-term home is a Cloudflare Worker → MailerLite tag + Smartwaiver link, per the Blue Element
  funnel-automation plan (`04_Build/AUTOMATION_PLAN.md`).

### SEO, shareability and meta (2026-08-18c)

- **Favicon set + apple-touch-icon + manifest** generated from the whale brand mark
  (`assets/logo/be_mark_color.png`) into `assets/favicon/`, plus a root `favicon.ico` and
  `site.webmanifest`.
- **Per-page Open Graph + Twitter Card** meta (title / description / canonical / url) injected into
  all 16 pages by a reusable, **idempotent** Python script at `scratchpad/inject_meta.py` — it
  skips any page that already has `og:title`.
- **1200×630 share image** at `assets/media/og-default.jpg` (cropped from the `kate-surface` shot).
- `theme-color` = **`#021b2e`**.

### Traps and gotchas

- **DesignSync `get_file` truncates images over 256 KiB** (`truncated:true`). Always export the
  design project as a ZIP instead of pulling files one by one. This bit the DWA build first.
- **GitHub Pages TLS cert can stall at `state:None`** for hours with correct DNS — fix by toggling
  the `CNAME` file off and on (see above), then enforce HTTPS via `gh api`.
- **GitHub Pages edge-caches `shop-links.js` for roughly 10 minutes**, so Stripe link changes take
  a few minutes to reach all visitors. Do not assume a wiring change is broken because it did not
  appear immediately.
- `camp-week` and `retreat-matt-hill` were used as `data-buy` ids on `camps.html` **before** they
  existed in the `STRIPE_LINKS` map, which silently downgraded both to a mailto. If you add a
  `data-buy` id anywhere, add the key to `shop-links.js` in the same change.
- Sizing photos: `sips -Z 2400` only shrinks; it will not upscale — safe to run over a mixed set.

### Open items

- **Capacities still unconfirmed:** Depth Camp ($725) and the Matt Hill retreat ($750) — the camp
  caps recorded above (camp-week 12; Matt Hill = combined total across both March weeks) came
  later, so reconcile before relying on them.
- Coaching **full-day price** not set.
- The **May 2026 event** was never resolved.
- Countdown "first official top" day is left at **Nov 10**, which is within the window but was
  never confirmed as the real date.
- **MailerLite:** the subscribe endpoint still needs pasting into `november-2026.html`, and the
  "on subscribe → send the pack" automation still needs building.
- **FormSubmit** confirmation click for `onboarding.html` still outstanding.
- Possible follow-ups, mirroring what shipped on Freeflow Dynamics: **JSON-LD**, `sitemap.xml`,
  `robots.txt`, `llms.txt`, and image `loading="lazy"`.
- Decide what to do with the partner-logo slots and the "Discover Dominica" section (keep or trim).
