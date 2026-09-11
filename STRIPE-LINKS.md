# Stripe Payment Links

> **All 21 slots are filled as of 11 September 2026.** The six below were created
> in the Stripe dashboard that day and pasted into `shop-links.js`. Nothing is
> outstanding. Keep this file as the map of slot id → product → price.

Six buttons on the live site currently say **Enquire** and send an email instead of
taking payment. They are already wired; each one needs a Stripe Payment Link
pasted into its slot in `shop-links.js` and it goes live immediately, with no
code change.

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
- Add the refund policy URL in **Settings → Business details**:
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
- **Collect tax automatically: left at Stripe's default (on).** It adds nothing
  today: the account has no tax registrations, and a live checkout was confirmed
  showing `Tax EC$0.00`. If a UK VAT registration is ever added, this would start
  applying 20% VAT — the account's head office is set to the United Kingdom.

## Two things worth a decision

1. **Checkout offers EC$ first.** The default currency shown is East Caribbean
   dollars at a rate that "includes a 3% conversion fee" (the camp link quoted
   4%). A customer sees EC$263.04 before they see US$95.00. The USD option is
   right there, but the first number they read is not the one on the website.
   This is Stripe's Adaptive Pricing — it can be turned off per price.
2. **Head office is United Kingdom.** Blue Element Freediving Inc. is a Dominica
   company, and the terms say Dominica law. Worth checking that the Stripe
   business address is what you want it to be.
