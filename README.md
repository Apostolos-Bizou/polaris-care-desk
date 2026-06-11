# Polaris Care Desk — Interim Manual Ops

Internal mockup console για τη διαδικασία direct-provider του POLARIS, μέχρι να είναι έτοιμη η ψηφιακή ροή MCL / Next2Care.

- **Status:** 🔵 Mockup — Phase 1 (group-lifecycle) · internal tool · fake data only, **no real PII**
- **Live:** https://apostolos-bizou.github.io/polaris-care-desk/
- **Repo:** https://github.com/Apostolos-Bizou/polaris-care-desk (public, separate repo — pattern του SOB-Polaris)
- **Stack:** Single-file HTML + vanilla JS (GitHub Pages) · bilingual EL/EN guide
- **Filed under:** POLARIS (δεν είναι MCL sub-project)

## Builds
- **index.html** — Το demo (GitHub Pages). Τελευταία έκδοση με CBMS utilization export
  (PAID CLAIMS + FUNDED LOA sheets), auto coverage-code mapping, TRN-status derivation,
  EWT/Net Paid, bank reconciliation, και πλήρη EL/EN guide (8 ενότητες).
  Τρέχει με fake/demo data.
- **index-basic.html** — Η προηγούμενη απλή έκδοση (χωρίς export), ως εφεδρική.

### ⚠️ Real-data use
Το demo στο GitHub Pages είναι ΜΟΝΟ για επίδειξη με fake data. Αν χρειαστεί να
τρέξεις κάτι με ΠΡΑΓΜΑΤΙΚΑ δεδομένα, κράτησέ το ΤΟΠΙΚΑ (άνοιξε το αρχείο από τον
υπολογιστή σου) — ποτέ μέσω του δημόσιου URL. Special-category health data →
local-only (GDPR gate). Το export χρειάζεται internet μία φορά για να φορτώσει
το SheetJS από CDN· μετά δουλεύει offline.

- `Polaris-Care-Desk_MCL-Portability.docx` — πώς μεταφέρεται το domain logic στο MCL

## MCL portability

Το domain logic (8 lifecycle steps + business rules) είναι απομονωμένο ως framework-agnostic block και προορίζεται να μεταφερθεί στο MCL **Next2Care** build ως `lib/lifecycle.ts`.
Αντίγραφο του portability doc βρίσκεται και στο `Documents\Projects\Next2MCL\Product-Specs\` ώστε να είναι ορατό όταν δουλεύουμε το Next2Care.

## Watch-outs

mockup ≠ product — όχι real users / όχι PII μέχρι το MCL.
