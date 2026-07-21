# Coding Style & Git Conventions

## 1. Code Style (TypeScript / React Native / Express)

### General Rules
- Use **TypeScript strict mode** (`strict: true` in tsconfig) across all packages.
- No `any` types. Use explicit interfaces, Zod schemas, or `unknown` with type narrowing.
- Prefer `const` over `let`. Never use `var`.
- All async functions must use `async/await` — no raw `.then().catch()` chains.
- All API responses must use typed response interfaces, not ad-hoc inline objects.
- No `console.log` in production code. Use a structured logger (e.g. `winston` on backend).
- No dead/commented-out code blocks. Remove unused variables and imports.

### Naming Conventions
| Context | Convention | Example |
|---|---|---|
| Variables & functions | `camelCase` | `loanApplicationId`, `verifyPhilSys()` |
| React components | `PascalCase` | `EGovSSOWidget`, `LoanSummaryCard` |
| TypeScript interfaces | `PascalCase` | `LoanApplication`, `EGovTokenResponse` |
| TypeScript types/enums | `PascalCase` | `LoanStatus`, `BusinessType` |
| Backend routes / files | `kebab-case` | `auth/egov.ts`, `sms/verify-otp.ts` |
| Environment variables | `SCREAMING_SNAKE_CASE` | `EGOV_CLIENT_SECRET`, `EMESSAGE_API_KEY` |
| Database columns | `snake_case` | `loan_id`, `created_at`, `is_verified` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_OTP_ATTEMPTS = 3` |

### File Organization
```
backend/src/
  routes/           # One file per feature domain
  middleware/       # Auth, validation, rate-limit
  services/         # Business logic (no HTTP in services)
  types/            # Shared TypeScript interfaces
  utils/            # Pure utility functions (hashing, formatting)

mobile/src/
  screens/          # Full screens (react-navigation pages)
  components/       # Reusable UI components
  hooks/            # Custom React hooks
  services/         # API calls and state management
  types/            # Shared TypeScript interfaces
```

---

## 2. Git Conventions

### Branch Naming
```
feature/<feature-name>       → feature/egov-sso
fix/<issue-description>      → fix/otp-expiry-race-condition
chore/<task>                 → chore/update-agents-docs
docs/<description>           → docs/add-credit-engine-spec
```

### Commit Message Format (Conventional Commits)
```
<type>(<scope>): <short description>

[Optional body: explain WHY, not WHAT]
[Optional footer: BREAKING CHANGE: ..., Closes #issue]
```

#### Types
| Type | When to use |
|---|---|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `docs` | Documentation only changes |
| `chore` | Build tasks, dependency updates, no production code change |
| `refactor` | Code restructure without behavior change |
| `test` | Adding or updating tests |
| `perf` | Performance improvement |

#### Examples
```
feat(egov-sso): add server-side exchange_code token validation
fix(epay): replace in-memory idempotency set with Redis persistence
docs(agents): update AGENTS.md Section 8 current priorities
chore(backend): upgrade axios to 1.7.x
```

### Pull Request Rules
- Every PR must reference a feature spec: `Implements: .agents/specs/<feature>/`
- PRs touching security-critical paths (auth, payments, biometrics) require explicit user review.
- No PR merges to `main` with unresolved TypeScript compile errors.

---

## 3. Error Handling Convention (Backend)

All backend route handlers must follow this response structure:

```typescript
// Success
res.status(200).json({ success: true, data: <payload> });

// Client Error (validation)
res.status(400).json({ success: false, error: 'Descriptive human-readable message.' });

// Upstream/External API Failure
res.status(502).json({ success: false, error: 'External service unavailable. Please retry.' });

// Server Error
res.status(500).json({ success: false, error: 'Internal server error.' });
```

Never expose raw error stack traces, upstream API error bodies, or environment variable names in API responses.
