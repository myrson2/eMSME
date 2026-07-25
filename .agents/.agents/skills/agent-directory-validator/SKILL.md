---
name: agent-directory-validator
description: Validates the structural integrity, spec completeness, architecture docs, memory context formatting, and skill structure of the .agents directory across workspace folders.
---

# 🛡️ .agents Directory Validator Skill

> **Role:** Senior Project Manager & AI Solutions Architect  
> **Purpose:** Ensures all workspace folders containing `.agents/` strictly adhere to the Spec-Driven Development architecture and project governance rules defined in `AGENTS.md`.

---

## 🏗️ 1. Architectural Overview & Design

The `.agents/` folder serves as the single source of truth for AI agent context, feature specifications, architecture designs, session handoffs, and reusable skills. If any subfolder is missing or improperly formatted, AI agents may produce hallucinated code, ignore security constraints, or lose state across sessions.

```
.agents/
├── AGENTS.md                  # Project identity, tech stack locks, guardrails
├── architecture/              # Cross-feature system design (system-overview.md)
├── conventions/               # Coding style, git, and auth conventions
├── mcps/                      # Tooling and external API configs (mcp-config.md)
├── memory/                    # Session handoff notes (context.md)
├── skills/                    # Reusable agent skills (<skill-name>/SKILL.md)
└── specs/                     # Spec-driven development feature specifications
    ├── template/              # Standard spec templates (spec, arch, impl, decisions)
    └── <feature>/             # Feature specification folder
        ├── spec.md            # Requirements & Acceptance Criteria
        ├── architecture.md    # Technical design, data models, API schemas
        ├── implementation.md  # Checklist of implementation tasks
        └── decisions.md       # Architectural Decision Records (ADRs)
```

---

## 📑 2. Folder Validation Rules Matrix

| Target Folder | Required Files / Subdirectories | Validation Rule | Diagnostic Action |
|---|---|---|---|
| `.agents/` | `AGENTS.md` | Must contain sections: Project Context, Tech Stack Constraints, Where Everything Lives, Required Workflow, Skills, MCPs, Guardrails, Current Priorities, Session Handoff, Project Structure. | ❌ Error if missing file.<br>🟡 Warning if missing standard sections. |
| `.agents/specs/` | Feature folders (e.g. `template/`, `<feature>/`) | Each feature folder MUST contain `spec.md`, `architecture.md` (or `arch.md`), `implementation.md` (or `impl.md`), and `decisions.md`. | ❌ Error if `spec.md`, `arch.md`, or `impl.md` missing.<br>🟡 Warning if `decisions.md` missing. |
| `.agents/architecture/` | `system-overview.md` | Broad system architecture overview. | 🟡 Warning if missing. |
| `.agents/conventions/` | Convention docs (e.g., `auth.md`, `git.md`) | Style guide and architectural rules. | 🟡 Warning if empty. |
| `.agents/mcps/` | `mcp-config.md` | Configuration of external tools and APIs. | 🟡 Warning if missing. |
| `.agents/memory/` | `context.md` | Session handoff notes for cross-session continuity. | ❌ Error if `context.md` is missing. |
| `.agents/skills/` | Skill subdirectories | Each skill folder MUST contain `SKILL.md` with YAML frontmatter (`name`, `description`). | ❌ Error if `SKILL.md` missing inside skill subfolder. |

---

## 🚀 3. How to Run Validation

### Option A: Run the Automated CLI Tool
```bash
node .agents/skills/agent-directory-validator/scripts/validate-agents-dir.js
```

### Option B: Manual Validation Checklist
1. Verify `.agents/AGENTS.md` exists and has no empty placeholder sections.
2. Check `.agents/specs/` to ensure every feature folder contains all four spec files (`spec.md`, `architecture.md`, `implementation.md`, `decisions.md`).
3. Confirm `.agents/memory/context.md` has the latest session handoff notes.
4. Validate that all custom skills inside `.agents/skills/<skill>/` have valid `SKILL.md` frontmatter.

---

## 📢 4. Human-Readable Error Diagnostic Format

When an issue is detected, the validator outputs formatted diagnostic logs designed for immediate understanding:

```text
❌ ERROR [.agents/specs/checkout]
   Issue: Missing spec.md
   Why it matters: AI agents cannot implement code without explicit requirements and acceptance criteria.
   How to Fix: Create .agents/specs/checkout/spec.md using the template in .agents/specs/template/spec.md
```
