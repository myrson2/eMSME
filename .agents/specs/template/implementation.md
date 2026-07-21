# Implementation Tasks: [FEATURE_NAME]

## Status
- **Feature:** [FEATURE_NAME]
- **Platform:** Mobile (`mobile/`) | Backend (`backend/`) | Frontend (`frontend/`)
- **Current Phase:** [ ] Planning | [ ] In Progress | [ ] Done

## Task Checklist

- [ ] **Task 1: Environment Setup**
  - Add required env vars to `backend/.env.example` and `mobile/.env.example`

- [ ] **Task 2: Backend Route(s)**
  - Create `backend/src/routes/<feature>/<name>.ts`
  - Wire router in `backend/src/routes/api.ts`

- [ ] **Task 3: Mobile Screen / Component**
  - Create `mobile/src/components/<ComponentName>.tsx`
  - Integrate with navigation or screen

- [ ] **Task 4: Integration & Edge Case Validation**
  - Test happy path
  - Test missing / invalid inputs → correct error codes
  - Test upstream failure scenarios (502 fallback)

## Notes
- *Add any implementation-specific gotchas or caveats here.*
