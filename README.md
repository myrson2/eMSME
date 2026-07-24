# eMSME - eGovPH Service Module (EGOV HACKATHON PROJECT)

eMSME is a service module inside the eGovPH ecosystem that helps MSME owners discover financial aid programs they qualify for, apply using documents already on file, and track applications end-to-end.

This repository contains:
1. **Backend** (`/backend`): An Express + TypeScript API that orchestrates credit scoring, state machine tracking, and integrations with eGovPH SSO, eVerify, and eMessage.
2. **Mobile** (`/mobile`): A React Native / Expo mobile application built with NativeWind that serves as the primary user-facing platform.
3. **Frontend** (`/frontend`): A Vite + React landing page (currently minimal/static representation).

---

## 🚀 Getting Started

Follow these step-by-step instructions to run the project locally.

### 1. Prerequisites

- **Node.js**: v18 or later.
- **npm** or **yarn**.
- **Expo Go app**: Installed on your physical device (iOS/Android), or an Android/iOS emulator installed on your computer.

### 2. Install Dependencies

First, you need to install the dependencies for both the backend and mobile workspaces. Run the following commands from the project root:

```bash
# Install backend dependencies
cd backend
npm install

# Install mobile dependencies
cd ../mobile
npm install

# Return to root (optional)
cd ..
```

### 3. Start the Backend API

The backend manages the SQLite database (`emsme.db`) which automatically creates the required tables on its first run. It runs on `http://localhost:3000`.

Open a new terminal window/tab:

```bash
cd backend
npm run dev
```

*You should see a message saying the server is running on `http://localhost:3000` and the database has been initialized.*

### 4. Start the Mobile Application (React Native / Expo)

Open a second terminal window/tab to start the Expo bundler:

```bash
cd mobile
npm start
```

This will launch the Expo Developer Menu in your terminal. You can run the app in several ways:
- **Android Emulator**: Press `a` in the terminal to launch on an active Android emulator.
- **iOS Simulator**: Press `i` to launch on an active iOS simulator.
- **Physical Device**: Scan the QR code shown in the terminal using the Expo Go app (Android) or the native Camera app (iOS).

> [!NOTE]
> **Important for physical devices**: If you test on a physical device, `localhost:3000` won't resolve correctly. You will need to start the mobile app using your local machine's IP address by setting `EXPO_PUBLIC_API_URL` before starting Expo.
> Example (Mac/Linux): `EXPO_PUBLIC_API_URL=http://192.168.1.5:3000/api npm start`
> Example (Windows PowerShell): `$env:EXPO_PUBLIC_API_URL="http://192.168.1.5:3000/api"; npm start`

### 5. Running Tests (Optional)

We have an integration test suite for the backend that tests the entire Onboarding & Loan Application lifecycle against the running server.

While the backend is running (`npm run dev`), open another terminal:
```bash
cd backend
npm run test:api
```
This runs the full end-to-end integration checklist (14 steps) confirming system integrity.

---

## 📁 Project Architecture

- `.agents/`: AI specs, architectural docs, design rules, and session memory.
- `backend/src/`: Contains routes, SQLite `db/index.ts` models, authentication middleware, and `services/` for business logic (credit scoring, verification routing).
- `mobile/src/`: Contains React Navigation setup (`navigation/`), NativeWind UI (`screens/`), and API context (`context/AuthContext.tsx`).
