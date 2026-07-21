# AGENTS.md

This file is the entry point for any AI agent working in this repo. Read this FIRST, every session, before touching code.

---

## 1. Project Context & Identity
- **Project Name:** eMSME
- **Primary Goal:** To create a platform that will help MSMEs in the Philippines to register their business, get funding, and access other resources that can help them grow.
- **Lender Definition:** eMSME acts as an **aggregator/marketplace** connecting MSMEs to third-party partner banks and financial institutions (e.g., LANDBANK, DBP) who provide the capital.
- **Development Focus:** **Mobile Application (`mobile/`)** is the primary user-facing platform. `frontend/` is used strictly as a static landing/marketing page.
- **Tone & Code Philosophy:** Write clean, modular, production-ready code. No placeholder logic, no dead comments, and no inline mock data inside production UI files.
---

## 2. Tech Stack Constraints (Strict Locks)
> ⚠️ **DO NOT deviate from these locked technologies under any circumstances.**

- **Mobile Application (PRIMARY):** React Native (Expo SDK, TypeScript)
- **Backend Infrastructure:** Express / Node (TypeScript) + SQLite
- **Web Frontend:** React + Vite (TypeScript) *(Landing Page & Web Callbacks Only)*
- **State Management:** React Context API / Custom Hooks

---

## 3. Where Everything Lives

| Need to know... | Go to |
|---|---|
| What a feature does / acceptance criteria | `.agents/specs/<feature>/spec.md` |
| How a feature is built (data model, flow, stack) | `.agents/specs/<feature>/architecture.md` |
| Current task status / what's left to build | `.agents/specs/<feature>/implementation.md` |
| Why a technical decision was made | `.agents/specs/<feature>/decisions.md` |
| Reusable capability (e.g. PDF gen, DB migration patterns) | `.agents/skills/<skill-name>/SKILL.md` |
| Which external tools/APIs are connected | `.agents/mcps/mcp-config.md` |
| Cross-feature system design | `.agents/architecture/system-overview.md` |
| Coding style / git conventions | `.agents/conventions/` |
| Key decisions/state from past sessions | `.agents/memory/context.md` |

---

## 4. Required Workflow (Spec-Driven Development)

**Before writing any code for a feature:**
1. Read `.agents/specs/<feature>/spec.md` — understand the *what* and acceptance criteria.
2. Read `.agents/specs/<feature>/architecture.md` — understand the *how*.
3. Check `.agents/specs/<feature>/implementation.md` — see what's already done, what's next.

**If no spec exists for a requested feature:**
- Stop and draft `spec.md` first. Confirm scope with the user before writing architecture or code.
- Do NOT start implementation on an unspecified feature, even for a "quick" hackathon add.

**While implementing:**
- Update the checkboxes in `implementation.md` as tasks complete.
- If you deviate from the architecture doc (change data model, swap a library, etc.), log it in `decisions.md` with a one-line reason.

**After implementing:**
- Re-check the acceptance criteria in `spec.md` before declaring the feature done.

---

## 5. Skills

Skills are global and reusable — never duplicate one inside a feature folder.

- Check `.agents/skills/` before writing boilerplate you suspect is common (e.g. auth middleware, DB migration scripts, PDF/report generation).
- If you build something reusable during this hackathon that you'll likely need again, propose turning it into a skill rather than leaving it feature-specific.

---

## 6. MCPs / External Tools

- See `.agents/mcps/mcp-config.md` for what's connected and what each is for.
- Don't assume a tool is available — check the tool list / config before relying on one (e.g. don't guess at a DB connector; verify it's wired up).

---

## 7. Guardrails

- **Primary Platform Focus:** Mobile (`mobile/`) is the primary user-facing application. Do NOT build application features in `frontend/` — keep `frontend/` as a clean landing page.
- **Authentication Conventions:**
  - All OAuth/SSO flows MUST use server-side token exchange.
  - Client secrets (`EGOV_CLIENT_SECRET`) must NEVER exist in `frontend/` or `mobile/`.
  - Authentication callbacks hit Express endpoint `/api/auth/egov/exchange`.
- **No scope creep:** Out-of-scope items are listed at the bottom of each `spec.md`. Don't build them unless the user explicitly asks.
- **Hackathon pragmatism:** Favor shipping over perfection — but don't skip updating specs/implementation docs.
- **Ask before big architectural changes** — log decisions in `decisions.md`.

---

## 8. Current Priorities

*(Last updated: 2026-07-21)*

### Completed Specs (All .md files only — no code written yet)
- [x] `egov-sso` — Mobile-native SSO spec (expo-auth-session + backend exchange)
- [x] `emessage-sms` — SMS OTP gateway spec
- [x] `everify` — PhilSys identity verification spec
- [x] `efacial-recog` — Facial liveness & biometric matching spec
- [x] `epay` — eGovPay payment gateway spec (Repayments only)
- [x] `egov-ai` — Conversational AI assistant spec
- [x] `eblockchain` — eGovChain blockchain audit trail spec

### Next Up (Specs complete — ready for implementation)
- [x] `loan-module` — Core loan application state machine, submission, and partner bank disbursement workflow
- [x] `user-onboarding` — Step-by-step mobile onboarding flow (SSO → eFacial → eVerify → Business Profile → Financial)
- [x] `credit-engine` — Credit scoring calculator implementation spec
- [x] `business-verification` — DTI/SEC/CDA/BIR/LGU routing and verification spec

### Immediate Next Steps (Implementation Phase)
- [ ] Scaffold `backend/` Express app (entry point, router, SQLite setup, JWT middleware)
- [ ] Run database migrations (all 6 SQLite table schemas)
- [ ] Implement `user-onboarding` routes + `business-verification` service
- [ ] Implement `credit-engine` pure functions + `assessLoan()` orchestrator
- [ ] Implement `loan-module` routes + amortization calculator + state machine
- [ ] Scaffold `mobile/` Expo app with navigation and all onboarding screens

### Blocked On
- None.

## 9. Session Handoff

At the end of a working session, append a short note to `.agents/memory/context.md`:
- What was completed
- What's half-done / needs finishing
- Any gotchas the next session should know about

## 10. Project Structure

```text
Project Template/
├── .agents/
│   ├── AGENTS.md                  # Generic AI entry point with updated placeholders
│   ├── architecture/              # Cross-feature system design
│   ├── conventions/               # Team coding style & git conventions
│   ├── mcps/                      # Tooling and external API configs
│   ├── memory/                    # Session handoff notes (context.md)
│   ├── skills/                    # Reusable agent skills
│   └── specs/                     # Spec-driven development folder
│       └── template/              # Reusable template for specs (spec, arch, impl, decisions)
├── backend/                       # Express + TypeScript backend (moved to root)
├── frontend/                      # React + Vite + TypeScript frontend (moved to root)
├── mobile/                        # React Native / Expo workspace
├── docs/                          # General documentation
├── package.json                   # Root orchestrator scripts (npm run dev, etc.)
├── package-lock.json
├── .gitignore
└── README.md
```

---
