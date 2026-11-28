# YGO Collection — development specification

Goal: a local-first, free Android application specifically for Yu-Gi-Oh! TCG, OCG and Rush Duel. No scan quotas, subscriptions or adverts. Preserve local backups and export. No mandatory server or account.

## Recognition requirements
- Capture multiple sharp frames before claiming high accuracy. The current implementation reads several regions of one high-resolution capture; independent frames are still pending.
- Resolve artwork, exact printed set code, card name/passcode, copy language, edition, rarity and alternate artwork independently where possible.
- Never silently infer rarity from the set code. Preserve alternative products and ask for confirmation if ambiguous. Rush/OCG JP codes must not be confused with TCG records.
- DE/EN are stored as copy languages; a separate OCG/Rush database is still required. Limited Edition is not yet a separate stored value.
- Validate on a labelled mixed test set, including identical-set-number rarity variants, early printings, foil glare, German, English, Japanese, Rush and consecutive identical copies. Record exact-printing accuracy, false auto-add rate, abstentions and median scan time, separately. Target at least 98% exact-printing accuracy on supported, legible test cards and under 0.5% incorrect automatic adds; these are goals, not measured results. Do not claim equivalent quality to Collectr until measured.

## Cardmarket requirements
Use the official daily game-3 price guide in EUR. A product-ID crosswalk must be verified at the printing/rarity level; never map just by card name or assume TCGplayer IDs equal Cardmarket IDs. Show source and update date and distinguish trend, minimum and 1/7/30-day averages. The daily guide is not a live language/condition/edition-specific offer feed. Unmatched cards must be labelled unverified, not presented as exact Cardmarket prices. Do not scrape restricted pages or redistribute downloads. The CI diagnostic reports schema and count, not the dataset. Android preview now has an optional one-time CardNexus catalogue key setup under Settings. It downloads provider-linked IDs locally and rejects one-to-many mappings; official Cardmarket daily guide data is cached and refreshed independently. Missing mappings retain explicitly non-Cardmarket estimates; product-level trend is not language, condition, or edition specific. Real coverage and on-device import remain to be measured.

## Collection and player features
Prioritize fast scan/review/undo, card counts, duplicate quantities, condition, language, set and rarity filters, bulk value sorting, binder/box locations, set completion and wishlist. Then add YDK deck import/export, main/extra/side, format legality and banlist date, missing cards and deck cost, trade/wants lists, price history, backup/restore and accessible German UI.

## Delivery
Existing package ID retained for upgrades; the debug CI APK is for preview only. No final release before build and physical phone testing. A successful build is not a scanner accuracy measurement.
