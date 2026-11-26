# YGO Edition — development preview

This branch is an experimental Android build, not a finished release.

- On-device Android OCR and exact set-number lookup are implemented but require device testing.
- Cardmarket price parsing primitives exist; automatic product mapping and pricing integration are not complete. Existing TCGCSV prices are still used.
- Ambiguous rarities require manual confirmation.
- The existing mobile release workflow builds a debug APK on pushes to this branch. No store publication is intended.
- Do not import a large collection until accuracy and backup/restore have been verified.
