# System Architecture Overview

## High-Level Topology

```text
+-------------------+                          +-------------------+
|   Expo (Mobile)   | === Main Platform REST ==> | Express (Backend) |
| React Native App  |                          |   Node + TS API   |
+-------------------+                          +-------------------+
                                                         ^        |
+-------------------+                                    |        v
|  React (Frontend) | ===== Web Landing Page ===========+   +-----------------------+
|   Vite + React    |                                       | eGov Gateway & DB     |
+-------------------+                                       | PhilSys/DTI/SEC/BIR   |
                                                            +-----------------------+
```

## Detailed System Specifications
For the full end-to-end System Architecture, sequence state machines, credit risk scoring engine design, eGov API gateway adapters, and complete TypeScript domain data models, see:
- 📖 [System Architecture Overview (.agents/architecture/system-overview.md)](file:///c:/Users/chrys/Documents/eMSME/eMSME/.agents/architecture/system-overview.md)

## Component Breakdown
- **`mobile/` (PRIMARY PLATFORM)**: React Native + Expo SDK application. Main user experience for Philippine MSMEs to register, complete eGov identity verification, submit business/financial data, track loan workflows, and manage repayments.
- **`backend/`**: Express + TypeScript API server orchestrating eGov API adapters (PhilSys, DTI, SEC, CDA, BIR, LGU), automated underwriting risk scoring engine, and encrypted PostgreSQL/SQLite database storage.
- **`frontend/`**: React + Vite + TypeScript web landing page for public marketing and web callback redirects.
