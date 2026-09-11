# Stripe Payment Links — still to create

Six buttons on the live site currently say **Enquire** and send an email instead of
taking payment. They are already wired; each one needs a Stripe Payment Link
pasted into its slot in `shop-links.js` and it goes live immediately, with no
code change.

Prices below are taken from the live pages — they are what a customer is being
shown today. **If any of them is wrong, fix the page as well as the link.**

---

## Create these six

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

## Paste the links here

Fill in the right-hand column, then the lines can go straight into `shop-links.js`:

```js
'coaching-private':   '',
'train-auto-day':     '',
'train-auto-week':    '',
'train-auto-month':   '',
'train-elite-day':    '',
'train-elite-month':  '',
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
