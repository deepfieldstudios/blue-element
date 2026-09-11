# Stripe Payment Links

> **All 21 slots are filled as of 11 September 2026.** The six below were created
> in the Stripe dashboard that day and pasted into `shop-links.js`. Nothing is
> outstanding. Keep this file as the map of slot id → product → price.

Each buy button on the site carries a `data-buy` slot id. `shop-links.js` maps
that id to a Stripe Payment Link; if a slot is ever empty the button falls back
to an enquiry email and relabels itself "Enquire".

Prices below are taken from the live pages — they are what a customer is being
shown today. **If any of them is wrong, fix the page as well as the link.**

---

## The six created on 11 September 2026

| # | Stripe product name | Price | Slot ID (`shop-links.js`) | Where the button is |
|---|---------------------|-------|---------------------------|---------------------|
| 1 | Private Coaching — Half Day | **$95** | `coaching-private` | book.html · camps.html |
| 2 | Autonomous Platform Access — Daily | **$35** | `train-auto-day` | book.html |
| 3 | Autonomous Platform Access — Weekly | **$125** | `train-auto-week` | book.html |
| 4 | Autonomous Platform Access — Monthly | **$375** | `train-auto-month` | book.html |
| 5 | Elite Support — Daily | **$75** | `train-elite-day` | book.html |
| 6 | Elite Support — Monthly | **$675** | `train-elite-month` | book.html |

All **USD**, all **one-off** payments (not subscriptions — "monthly" here means a
month's access sold once, not a recurring charge).

---

## The links, as pasted

```js
'coaching-private':   'https://buy.stripe.com/8x2aEW50P5MJfWwdVkdby0f',
'train-auto-day':     'https://buy.stripe.com/4gM9AS8d15MJaCceZodby0g',
'train-auto-week':    'https://buy.stripe.com/fZu6oGctha2Z4dO7wWdby0h',
'train-auto-month':   'https://buy.stripe.com/fZu6oG1OD8YV39K4kKdby0i',
'train-elite-day':    'https://buy.stripe.com/aFa7sK8d18YVaCc7wWdby0j',
'train-elite-month':  'https://buy.stripe.com/aFa8wO8d1b734dO8B0dby0k',
```

---

## How to create one in Stripe

1. Dashboard → **Payment links** → **+ New**
2. **Products** → *Add a new product* → name it exactly as in the table above
3. Price → the amount from the table → **One-off** → USD
4. Leave the rest as default. Under *After payment*, "Show confirmation page" is fine.
5. **Create link** → copy the URL (it looks like `https://buy.stripe.com/xxxxxxxx`)
6. Paste it into the matching slot above

Worth turning on once, in **Settings → Payments → Checkout**: collect the
customer's **name** and **phone**, and add a custom field for **dates requested**.
Without it you get a payment and no idea which week they want.

---

## Already done — do not recreate

These fifteen are live and working. Listed so nothing gets duplicated.

| Slot ID | Product | Price |
|---------|---------|-------|
| `course-try` | Try Freediving | $175 |
| `course-freediver` | Freediver (AIDA 2 / Wave 1) | $450 |
| `course-advanced` | Advanced Freediver (AIDA 3 / Wave 2) | $525 |
| `course-master` | Master Freediver (AIDA 4 / Wave 3) | $650 |
| `course-vb-safety` | Vertical Blue Safety Course | $450 |
| `course-nolimits` | No Limits Session | $150 |
| `course-instructor` | AIDA Instructor Course | $1500 |
| `eq-clinic` | Advanced EQ Clinic | $150 |
| `camp-week` | Depth Camp — week | $750 |
| `retreat-matt-hill` | BE × Matt Hill retreat | — |
| `comp-nov-aida` | November 2026 entry | $850 |
| `comp-nov-aida-training` | November 2026 entry + 1 month training | $1100 |
| `comp-nov-cmas` | November 2026 CMAS entry | — |
| `comp-mar-aida` | March Mini 2027 entry | $600 |
| `comp-may-open` | May Open 2027 entry | $850 |

---

## After the links are in

- Paste into `shop-links.js`, commit, push. The buttons change on their own —
  `shop-links.js` swaps the href and relabels "Enquire" → "Book Now".
- Check one live: the button should go to `buy.stripe.com`, not open an email.
- Still outstanding: add the refund policy URL in **Settings → Business details**:
  `https://blueelementstore.com/terms.html`
  Stripe shows it at checkout and it is the single best defence against chargebacks.

---

## How these six were configured

- **One-off**, **USD**, to match the fifteen that already existed.
- **Managed Payments: off.** Stripe reported the products ineligible anyway, so
  the 3.5% per-transaction fee does not apply.
- **Collect customer names: on.** A booking that arrives as an email address and
  an amount is very hard to administer. The older fifteen do not collect names —
  worth turning on for them too.
- **Collect tax automatically: OFF on all 21 links** (11 Sep). It was adding
  nothing today — no tax registrations exist — but the newer products are
  tax-*exclusive*, so any future registration would have added tax **on top** of
  the advertised price. With it off, $95 is $95. Verified on the live checkout:
  the Tax row is gone entirely.

## Two things worth a decision

1. **Checkout offers EC$ first, and this cannot be changed from the dashboard.**
   The default currency shown is East Caribbean dollars at a rate that "includes
   a 4% conversion fee" — a customer sees EC$265.59 before US$95.00. This is
   Stripe's Adaptive Pricing. Under Settings → Payments → Adaptive Pricing it is
   listed as **"Payment Links and Managed Payments — Always on"** with no toggle;
   the switch on that page only governs Checkout, Elements and the Hosted Invoice
   Page. The supported-currency list is informational, with no per-currency
   controls. To force USD only you would need either Stripe support to disable it
   on the account, or the API (`adaptive_pricing[enabled]=false`), which needs a
   secret key.
2. **Head office is United Kingdom.** Blue Element Freediving Inc. is a Dominica
   company, and the terms say Dominica law. Worth checking that the Stripe
   business address is what you want it to be.


---

## Account settings changed on 11 September 2026

- **Terms of service URL** set to `https://blueelementstore.com/terms.html` under
  Settings → Business → Business details → Customer-facing information. Stripe
  has no separate "refund policy" field; the terms page carries the refund policy
  as section 2, so this is the right home for it. Stripe surfaces it at checkout.
- Nothing else in account settings was touched.

## Two notes for whoever picks this up next

- **Customer support email is still blank** in that same dialog. Stripe asks for
  it specifically because it reduces disputes — worth 30 seconds.
- **The business address on the Stripe account is in Woodstock, Oxfordshire.**
  Blue Element Freediving Inc. is a Dominica company and the published terms say
  Dominica law. That mismatch is why Stripe Tax was defaulting to UK VAT at 20%.
  Tax collection is now off everywhere so it costs nothing today, but the address
  is worth a look.

## Driving the Stripe dashboard — what actually works

Written down because several changes silently failed the first time:

- `form_input` on a checkbox changes the DOM but does **not** fire the event
  Stripe's React form listens for. The form state never changes and "Update link"
  saves nothing, with no error. Use a real click on the **label** instead.
- The first click on a freshly loaded edit page often does not register. Click,
  screenshot to confirm the checkbox actually moved, and only then save.
- Element refs change every time the page re-renders. Re-run `find` for the
  "Update link" button immediately before clicking it — a stale ref clicks
  nothing, and the only clue is the browser's "Leave site?" warning.
- A save has landed only when the URL drops the `/edit` suffix. Verify by
  reloading the edit page, not by assuming the click worked.
