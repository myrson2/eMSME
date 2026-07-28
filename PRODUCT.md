# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Micro, Small, and Medium Enterprises (MSMEs) in the Philippines looking to register their business, verify government credentials, get funding/loans, and access grant resources.

## Product Purpose

Acts as a streamlined aggregator and marketplace connecting Philippine MSMEs to government institutions and partner banks (LANDBANK, DBP, SB Corp, DOST) for capital and growth resources.

## Positioning

Integrated eGovPH ecosystem access (PhilSys eVerify, eFace Liveness, eMessage SMS, government registry validation) offering automated credit scoring and friction-free loan/aid applications.

## Operating Context

Mobile application environment (`mobile/`) where business owners complete focused tasks: checking application statuses, submitting financial snapshots, verifying business credentials, and applying for loan matches.

## Capabilities and Constraints

- Primary application is React Native (Expo, TypeScript).
- Backend infrastructure is Express + SQLite.
- Static landing page only in `frontend/`.
- Strict integration with eGovPH SSO, PhilSys eVerify, and eFace Liveness biometric validation.

## Brand Commitments

- FlagAccent stripe motif reflecting Philippine nationhood and institutional identity.
- Calibrated, desaturated palette (`ink`, `surface`, `primaryMuted`).
- *Note:* Previous font choice (Outfit) is discarded per user request; open for a more characterful, high-fidelity typography system.

## Evidence on Hand

- 15 functional mobile screens in `mobile/src/screens/`.
- Backend endpoints for loan applications, business profile verification, and identity checks in `backend/`.

## Product Principles

1. **Task-First Utility (Operate Mode):** Fast, predictable, scan-driven UI built for busy business owners completing real workflows.
2. **Institutional Integrity:** Credible, secure feel suitable for government and bank partnerships without sterile bureaucracy or decorative slop.
3. **Data Clarity:** Numerals, rates, and amounts must be immediately legible and precisely aligned.

## Accessibility & Inclusion

- Optimized for touch targets on iOS and Android.
- High-contrast text legible under daylight mobile conditions.
