# AGENTS.md

This file is the entry point for any AI agent working in this repo. Read this FIRST, every session, before touching code.

---

## 1. Project Context & Identity
- **Project Name:** [PROJECT_NAME]
- **Primary Goal:** [PRIMARY_GOAL]
- **Tone & Code Philosophy:** Write clean, modular, production-ready code. No placeholder logic, no dead comments, and no inline mock data inside production UI files.
---

## 2. Tech Stack Constraints (Strict Locks)
> ⚠️ **DO NOT deviation from these locked technologies under any circumstances.**

- **Web Frontend:** React + Vite (TypeScript)
- **Backend Infrastructure:** Express / Node (TypeScript)
- **Mobile Framework:** React Native (Expo SDK)
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

- **Stack boundaries:** [e.g. "Backend only — no frontend framework decisions without asking"] *(fill in for your team)*
- **No scope creep:** Out-of-scope items are listed at the bottom of each `spec.md`. Don't build them unless the user explicitly asks.
- **Hackathon pragmatism:** Favor shipping over perfection — but don't skip updating specs/implementation docs, since that's what keeps the whole team (and the AI) in sync under time pressure.
- **Ask before big architectural changes** (e.g. swapping SQLite for Postgres) — log the decision either way.

---

## 8. Current Priorities

*(Update this section as the hackathon progresses — it's the fastest way to re-orient a fresh session.)*

- [ ] Feature in progress: [INITIAL_FEATURE_NAME] — see `.agents/specs/[INITIAL_FEATURE_NAME]/implementation.md`
- [ ] Next up: —
- [ ] Blocked on: —

---

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
