# System Architecture Overview

## Architecture Diagram

```text
+-------------------+       HTTP / REST       +-------------------+
|  React (Frontend) |  -------------------->  | Express (Backend) |
|   Vite + React    |  <--------------------  |   Node + TS API   |
+-------------------+                         +-------------------+
                                                        |
                                                        v
+-------------------+                         +-------------------+
|   Expo (Mobile)   |                         |  Database / Store |
| React Native App  |                         | (SQLite/Postgres) |
+-------------------+                         +-------------------+
```

## Component Overview
- **`frontend/`**: React + Vite + TypeScript web client.
- **`backend/`**: Node.js + Express + TypeScript REST API.
- **`mobile/`**: React Native Expo mobile workspace.
