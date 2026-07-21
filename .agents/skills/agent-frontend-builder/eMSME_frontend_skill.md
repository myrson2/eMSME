---
name: emsme-frontend-skill
description: Frontend design system and UI rules for eMSME, a React Native mobile app extending eGovPH. Use this whenever generating, editing, or reviewing any screen, component, or style in this codebase.
applies_to: React Native (Expo), NativeWind
status: DRAFT — confirm font licensing and remaining open questions (marked ⚠️) before final build
---

# eMSME Frontend Skill

## 0. What this app is, in one paragraph

eMSME is a service module inside the eGovPH ecosystem, not a standalone brand. It helps MSME
owners (anchored on the "Aling Marites" persona — informal/semi-formal micro-enterprise owner,
moderately digitally literate) discover financial aid programs they actually qualify for, apply
using documents already on file with eGovPH instead of resubmitting them, and track applications
and disbursements end-to-end. Every screen should read as "eGovPH, but for MSMEs" — recognizable
before a single word is read.

**Rule for the AI IDE: if a design decision isn't covered below, default to matching the parent
eGovPH app's existing pattern (see `/reference/egovph-home-screenshot.png`) rather than inventing
something new.** eMSME differentiates through naming, iconography, and IA — never through a new
color, a new radius language, or a new tone.

### 0.1 API roles at a glance

| API | Role in this app |
|---|---|
| eGov | Sign-in widget / SSO entry point |
| eVerify | Digital government ID check — identity verification, document verification |
| eMessage | OTP delivery for step-up auth **and** push/in-app notifications (§3.6) — two roles, one API |
| eFacial recog | Biometric step-up auth — alternative to OTP, not a second required factor (§3.0) |
| eGovAI | In-app customer support / assistant surface (§3.7) |
| eGovChain | Transaction tracking between loans — ledger/audit trail scoped to financing activity, not a general-purpose blockchain feature (§3.3) |
| ePay | Paying and receiving money for lending services (disbursement, and repayment once in scope) |

---

## 1. Design Tokens

Treat this as the literal source of truth. Do not eyeball colors or spacing from screenshots —
use these values.

### 1.1 Color

```js
// tailwind.config.js (NativeWind)
colors: {
  primary: '#1740DE',      // eGov Blue — primary buttons, active nav, links, icon strokes
  'primary-dark': '#0F39D2', // pressed states, dark accents
  signal: '#E63B27',       // "New" badges, required-field markers, Rejected status
  amber: '#D99C45',        // secondary icon details, warning states, Pending status
  lavender: '#EFF1FD',     // icon container fill, card backgrounds, section backgrounds
  surface: '#FFFFFF',
  ink: '#1A1A1A',          // primary text, headlines
  body: '#4A4A4A',         // secondary/body text
  border: '#E2E5F0',       // ⚠️ not in original doc — proposed neutral for input borders, confirm ok
}
```

**Ratio rule (enforce this, don't just note it):** Blue ≈ 85–90% of any screen's color use.
Lavender = backgrounds/containers. Signal red + amber combined < 10%, reserved for status only.
If a generated screen has more than one non-blue accent color competing for attention, that's a
bug — flag it, don't ship it.

### 1.2 Typography

| Role | Typeface | Size | Weight |
|---|---|---|---|
| H1 (screen titles) | Sofia Pro Soft Bold* | 28px | Bold |
| H2 (section headers) | Sofia Pro Soft Bold* | 22px | Bold |
| H3 (card titles) | Sofia Pro Soft Bold* | 18px | Bold |
| Body | Inter Regular | 15px | Regular |
| Caption / labels | Inter Medium | 13px | Medium |
| Nav label | Sofia Pro Soft Bold* | 12px | Bold |
| Numerals (balances, IDs, dates) | Inter, tabular figures | context | Regular/Medium |

**\* Font sourcing — read this before generating any component:**

Sofia Pro Soft Bold is a paid commercial typeface (Mostardesign foundry). It is not available on
Google Fonts and cannot be embedded without a license. Two-track plan:

- **Track A (final):** Once licensed, drop the `.otf`/`.ttf` files into `assets/fonts/`, register
  via `expo-font` in `App.tsx`:
  ```js
  const [fontsLoaded] = useFonts({
    'SofiaProSoftBold': require('./assets/fonts/SofiaProSoftBold.otf'),
    'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
  });
  ```
  Reference the family name string directly in NativeWind via `fontFamily` token, not by weight
  props — RN does not reliably fake-bold a licensed font file.

- **Track B (build now, swap later):** Until the font is licensed, use **Poppins SemiBold/Bold**
  as the display-face stand-in — it's free (Google Fonts / `@expo-google-fonts/poppins`), shares
  the same rounded-geometric, confident character as Sofia Pro Soft, and won't require re-doing
  layout/line-height work when you swap the real font in later. Do **not** substitute a serif or a
  sharp-cornered grotesk — that changes the personality of the whole app, not just the font name.

Body/caption face: **Inter** (free, `@expo-google-fonts/inter`) — no substitution needed, use
directly.

**Accessibility:** never set Sofia Pro Soft Bold below 16px except the 12px nav label (short,
fixed strings only). Bold display faces at small size + low weight-contrast can fail WCAG for
low-vision users — this isn't optional polish, check contrast ratio on Deep Blue text over white
before shipping any new screen.

### 1.3 Spacing & Radius

```js
spacing: base 8px grid — use multiples of 8 (8, 16, 24, 32) for all padding/margin, no arbitrary values
borderRadius: {
  pill: 999,     // badges, chips, status pills
  md: 12,        // buttons, input fields
  lg: 18,        // cards, banners (16-20 range, use 18 as default)
  full: '50%',   // icon containers — always circular
}
```

### 1.4 Elevation

Interface is flat by default. **Exactly one elevated element per screen** — matches eGov's single
FAB pattern. If a generated screen has shadows on every card, that's over-designed — strip all but
the one primary action.

---

## 2. Navigation & Information Architecture

Bottom tab bar, 5 items, center FAB — same skeleton as eGov, different content:

| Position | Tab | Icon style | Behavior |
|---|---|---|---|
| 1 | **Home** | outline, 2-tone | Assets/liabilities summary + list of registered businesses under this eGovPH account (§3.1) |
| 2 | **Aid** | outline, 2-tone | Matches + Applications, segmented control inside, filterable by business |
| 3 (center, elevated FAB) | **Scan/Upload** | filled circle, blue, white icon | Check-then-fill document flow (§3.5) |
| 4 | **Documents** | outline, 2-tone | Shared document vault across all businesses |
| 5 | **Account** | outline, 2-tone | Business profile settings, personal info, app settings |

Active tab: blue icon + blue label. Inactive: `ink`-colored icon + `body`-colored gray label.
Exactly matches eGov's active/inactive convention — do not invent a different active-state
treatment (e.g. no background pill behind active tab, no animated indicator — eGov uses plain
color change only).

**Resolved:** one "Aid" tab, segmented control at the top switching between "Matches" and
"Applications" (iOS "Following / For You" pattern) — not two separate top-level tabs. Segmented
control sits directly under the screen header, full-width, `bg-lavender` track with a white/
elevated pill for the active segment, label in Sofia Pro Soft Bold 13px.

**eGovAI support entry point:** a persistent, low-profile affordance (not a tab — see §3.7) rather
than a sixth nav item. Do not add a sixth bottom-tab position for this.

---

## 3. Screen Specs

### 3.0 Login & Step-Up Auth

Two distinct auth moments — don't conflate them:

**A. Primary login (session start):**
1. **"Log in using eGov creds"** — single SSO entry point via the eGov sign-in widget. This is the
   only screen where the user enters a password/credential directly; everything downstream reuses
   this session.
2. On success, eVerify silently confirms the digital ID tied to the account is valid/active before
   the session is considered fully authenticated. No separate user-facing screen for this step —
   it's a background check with a loading state only, not a form.

**B. Step-up auth (triggered before high-risk actions only — application submission, first login
on a new device, viewing/editing banking details for disbursement):**
- User is presented **either/or**, not both: **OTP via eMessage** or **eFacial recog**.
- Render as two equally-weighted buttons on one screen — "Use SMS code" / "Use Face Verification"
  — no default pre-selection that implies one is preferred. Some users won't have a working camera
  or good lighting; some won't have signal for SMS. Neither path should read as the "real" one.
- Once one method is chosen and completes, the action proceeds — do not chain into the second
  method afterward. Either/or means either is sufficient, not sequential.
- Failed attempt copy must name the specific failure ("Code expired, request a new one" /
  "Face not recognized, try again or use SMS instead") and always offer the other method as a
  visible fallback link, never a dead end on one method.

⚠️ **Not yet resolved:** how many step-up auth failures before the flow locks and requires a
different recovery path (e.g. contact support via §3.7). Needs a number before final build.

### 3.1 Home — Summary + Business List

Two stacked sections on one screen (merged per current direction — see open question below):

**Top section — Assets/Liabilities summary:**
- Header: identical pattern to eGov Home — logo/wordmark top-left (standalone eMSME lockup, since
  this lives inside the eGovPH app shell), bell/notification icon top-right with red dot badge,
  "Hi, [Name]" greeting below.
- Compact summary row/card: total active grants received, total outstanding loan balance across
  all businesses — read-only figures, tapping either scrolls/links to the relevant Aid or
  Applications view rather than opening a new top-level screen.
- Do **not** call this section or any component "Wallet" — see §6 Never rules. This is a status
  summary, not a funds-holding feature.

**Bottom section — Business list:**
- Business cards, one per registered business:
  - Business name (H3, Sofia Pro Soft Bold)
  - Registration status badge (pill): **Informal** (gray) / **Partial** (amber) / **Verified**
    (blue) — a spectrum, never a gate. Do not hide unregistered businesses or block them from
    having a card here.
  - Profile completeness bar + %, with actionable microcopy: "72% complete — add your barangay
    clearance to unlock 3 more programs." This bar is the single highest-value UI element on this
    screen — it's what visibly drives the app's core benefit. Never render it as decoration only.
  - Quick stat: "3 new matches" (links into Aid, scoped to this business)
- Empty state (no businesses yet): illustration using the flag/sun-ray motif (matches eGov's
  onboarding art direction), one-line copy, one primary button: "Add your business."
- Tapping a card → Business Detail, which scopes Aid/Documents to that business only.

⚠️ **Open question, not fully resolved:** whether the summary section stays permanently merged
into Home, or eventually earns its own tab as the business count/financing activity grows per
account. Build the merged version now; keep the summary section as a separable component so it can
be promoted to its own tab later without a rewrite.

### 3.2 Aid — Matches & Applications

Two views inside one segmented control, not one merged feed — merging them hides which cards need
action from the user vs. which are informational only.

**Matches tab:**
- Card per matched program: program name, issuing agency (DTI/DSWD/LGU/SB Corp — show the source,
  it builds trust), amount/type (grant or loan), one-line eligibility reason ("Matched: DTI-
  registered, revenue under ₱3M").
- Status: New Match (signal-red dot) / Viewed / Dismissed.
- Primary action per card: "Apply" — only visible action, no ambiguity about what to do next.

**Applications tab:**
- Full state machine, not a flat "pending/accepted/rejected" list:
  `Draft → Submitted → Under Review → Additional Documents Requested → Approved →
  Disbursement Processing → Disbursed`, plus `Rejected` (always with a stated reason, never bare)
  and `Withdrawn/Expired`.
- **Additional Documents Requested** needs its own visually distinct treatment (amber, not red —
  it's action-needed, not failure) since this is where applications die from inaction, not
  rejection.
- Grants vs. Loans get different card bodies once Disbursed (see 3.3) — same list, different
  card component.

### 3.3 Financing cards (inside Applications, post-approval)

Grants and loans are structurally different — don't use one card type for both.

- **Grant card (disbursed):** amount, disbursed date. That's it — a grant's story ends here.
- **Loan card (disbursed):** principal, **outstanding balance** (the number that matters most —
  make it the largest text on the card), progress bar (paid vs. total), next payment due date,
  status chip (Active / Overdue / Paid Off). Read-only for now — no in-app repayment flow yet
  (⚠️ confirmed out of scope for this build; don't generate payment UI).
- **eGovChain tracking:** each loan card links to a "Transaction History" detail view — a simple
  reverse-chronological ledger of disbursement and (once in scope) repayment events, sourced from
  eGovChain. Frame this to the user as "Transaction History," never expose the word "blockchain"
  or "ledger" in user-facing copy — it's an implementation detail, not a selling point for this
  persona.

### 3.4 Documents — Shared Vault

- List of document types: valid ID, DTI registration, barangay clearance, business permit, etc.
- Each row shows one of two states clearly:
  - **"Already verified via eGovPH ✓"** — pulled from eVerify, zero user effort, green check,
    optional "View" link. Do not let the AI IDE render this as an upload button — it must look
    inert/complete, not actionable.
  - **"Upload needed"** — tappable, opens camera/file picker.
- ⚠️ Personal docs (valid ID) vs. business-specific docs (DTI reg, barangay clearance) need
  separate tagging once multi-business is real — do not let a business-specific document silently
  apply to the wrong business. Confirm eVerify's actual data shape (tagged by business vs. tagged
  to citizen only) before finalizing this screen's data model.

### 3.5 Scan/Upload (FAB flow)

This is a **check-then-fill** flow, not a plain camera button:

1. Tap FAB → app queries eGovPH/eVerify: "Do we already have this on file?"
2. Already on file → show as verified instantly (see 3.4), no camera opens.
3. Not on file → camera/upload triggers, only for what's actually missing.

Render step 2 as a visible moment in the UI (a checklist populating with checkmarks), not a silent
background call — this is the clearest way to *show* "no resubmitting," not just implement it.

### 3.6 Notifications

Extends the bell icon already spec'd on Home (§3.1) — don't design a new entry point, this is the
same icon/badge convention eGov already uses, just with eMSME-specific content behind it.

**Trigger events (what actually generates a notification):**
- **New Match found** — the highest-priority type. This is the moment a user learns they're
  eligible for something, which is the app's core differentiator from your original problem
  statement (people currently only find out *after* applying). Treat this as a first-class push
  notification, not an afterthought.
- **Additional Documents Requested** — action-needed, time-sensitive (applications die here).
- **Application status change** — Under Review → Approved, or → Rejected (with reason).
- **Disbursement processing → Disbursed** — closes the loop on "will the money actually arrive."

**Bell icon (header, all screens):** red dot badge when any unread notification exists — same as
eGov's existing treatment, no change to that component. Tapping opens the Notification Center.

**Notification Center screen:**
- Simple reverse-chronological list, grouped by date ("Today," "This week," "Earlier").
- Unread row: `bg-lavender` fill, small blue dot at left. Read row: white bg, no dot.
- Row anatomy: icon (matches the 2-tone icon-container style at a smaller ~40px size, color-coded
  by type — blue for matches/status, amber for action-needed) + one-line message + relative
  timestamp ("2h ago").
- Tapping a row deep-links straight to the relevant record — a Match notification opens that
  program's card in the Matches segment, a Documents Requested notification opens that
  application's detail, etc. Never dead-end on the notification list itself.

**Copy pattern (plain, specific, action-first — per §5 voice rules):**
- Match: *"You may be eligible for [Program Name] — [Agency]. Tap to view."*
- Docs requested: *"[Program Name] needs 1 more document: Barangay Clearance."*
- Status change: *"Your application for [Program Name] is now Under Review."*
- Disbursed: *"₱[Amount] from [Program Name] has been disbursed."*

Never write a vague notification ("You have an update") — every notification names the program
and the specific action or fact, matching the "never vague" error-copy rule in §5.

**Push notification permission:** ask for push permission contextually — right after a user
completes their first business profile (the moment a match becomes possible), not on first app
launch before there's anything to notify about.

**Note on eMessage's second role:** eMessage delivers both OTP codes (§3.0) and these
notifications. Keep the two experiences visually distinct in the user's phone-level notification
tray if possible (different preview text patterns) so an OTP code is never confusable with a
program update at a glance.

### 3.7 eGovAI — In-App Support

- Entry point: a small persistent affordance, not a bottom-tab item (see §2) — a floating
  chat-bubble icon, blue, bottom-right corner, sitting above the tab bar on every screen except
  the step-up auth screens (§3.0), where support should not be reachable mid-authentication.
- Opens a simple chat interface: user types a question, eGovAI responds. Scope this to
  **app usage and program questions** ("Why was my application rejected?", "What documents do I
  still need?") — not general chit-chat, not a substitute for human agency support on financial
  disputes.
- If eGovAI cannot resolve a question (⚠️ threshold/logic not yet defined), the chat must offer a
  clear handoff — a labeled button such as "Talk to a human agent" — never let the conversation
  loop or dead-end with the bot repeating itself.
- Visual treatment: reuses the Card and icon-container tokens from §1 — do not design a novel chat
  bubble style, novel color, or novel avatar system for this. It should look like the rest of the
  app, just in conversational form.

---

## 4. Component Library

| Component | Spec |
|---|---|
| Primary button | `bg-primary`, white Sofia Pro Soft Bold label, `rounded-md` (12px), full-width on forms |
| Secondary/text CTA | Blue text + arrow icon, no fill — e.g. "Avail Services →" pattern, used for low-pressure links only, never as a substitute for a real primary button |
| Status pill | `rounded-pill`, filled: Signal (red/white) = urgent/rejected, Amber (amber bg/ink text) = pending/action-needed, Gray (neutral) = draft/informal |
| Icon container | Circle, 64–72px, `bg-lavender`, two-tone icon (blue stroke + amber accent), 2px stroke at 64px |
| Card | `rounded-lg` (18px), flat (no shadow) unless it's the one elevated element on screen |
| Form field | `rounded-md`, 1px `border-border`, focus state = blue border + `bg-lavender` fill |
| Progress bar | Track = `bg-lavender`, fill = `bg-primary`, used for both profile completeness and loan repayment — same visual language, different context |
| Auth method choice card | Two equal-weight cards side by side (or stacked on narrow screens), icon + label + short description, no visual hierarchy implying a preferred option (§3.0) |
| Chat bubble (eGovAI) | User message: `bg-primary`, white text, right-aligned. Assistant message: `bg-lavender`, `ink` text, left-aligned. Same radius/spacing tokens as Card. |

---

## 5. Voice & Tone (applies to all generated copy)

- Bilingual by default — Filipino/English mixed naturally ("Mag-apply," not "Submit Application").
- Plain-language, action-first labels over bureaucratic phrasing.
- Warm but efficient — reads like a helpful government employee, not a marketing app.
- Errors state what happened and how to fix it, never vague, never apologetic filler.
- Empty states are an invitation to act, not a dead end — always pair with one clear next step.
- Never expose backend/infrastructure terms to the user — no "blockchain," "ledger," "API," or
  similar jargon in user-facing copy (see §3.3). Describe what the user gets, not how it works.

---

## 6. Rules for the AI IDE — quick reference

**Always:**
- Pull colors/spacing/radius from §1 tokens, never eyeball or invent new values.
- Keep blue ≈ 85–90% of any screen's color.
- One elevated (shadowed) element per screen, maximum.
- Treat registration status as a badge/spectrum, never as a gate to access a screen.
- Give Grants and Loans separate card components once disbursed.
- Show "Additional Documents Requested" as its own amber state, distinct from Rejected.
- Present OTP (eMessage) and Face Verification (eFacial recog) as equal, either/or options for
  step-up auth — never default-select one or imply a preference (§3.0).
- Keep the eGovAI support entry point as a persistent floating affordance, not a tab (§3.7).

**Never:**
- Don't call any screen or component "Wallet" — this app does not hold funds in-app.
- Don't introduce a new accent color "to make eMSME stand out."
- Don't set body text or dense form copy in Sofia Pro Soft — display/headline use only, 16px+.
- Don't generate an in-app loan repayment/payment flow — read-only balance only, for now.
- Don't let a FAB or shortcut skip the Match → Apply sequence — applying without a matched
  program first undercuts the app's core differentiator.
- Don't write a vague notification ("You have an update") — always name the program and the
  specific fact or action, per §3.6.
- Don't add a second notification entry point — one bell icon, one Notification Center, reuse the
  eGov badge convention rather than inventing a new one.
- Don't chain both step-up auth methods together on one action — either/or means either is
  sufficient, not sequential (§3.0).
- Don't expose the word "blockchain" or "ledger" in any user-facing screen — eGovChain-backed
  views are labeled "Transaction History" only (§3.3).
- Don't add a sixth bottom-tab position for eGovAI support — it's a floating entry point, not a
  tab (§2, §3.7).

---

## 7. Open questions still affecting this spec (⚠️ flagged above, collected here)

1. eVerify document tagging: per-business or per-citizen only? Affects §3.4 data model.
2. Font license timeline for Sofia Pro Soft Bold — using Poppins as stand-in until resolved.
3. No service-detail or form screen reference has been provided yet — form field density and
   validation-error styling in §4 are extrapolated from the brand doc, not visually confirmed
   against a real eGovPH form screen.
4. Push notification delivery mechanism not yet specified — is a new-match event detected
   server-side (e.g. a scheduled matching job against eGovPH data) or client-triggered on app
   open? This affects whether "New Match" pushes can even work while the app is closed, which
   matters if it's meant to be the app's headline feature.
5. Step-up auth lockout policy: how many failed OTP/Face attempts before the flow requires a
   different recovery path (e.g. escalate to eGovAI support handoff)? Needs a number (§3.0).
6. eGovAI resolution threshold: what logic decides a question needs human handoff vs. a bot
   answer? Not yet defined (§3.7).
7. Home summary section (§3.1): confirm whether it stays permanently merged with the business
   list or is promoted to its own tab later — build merged now, keep the component separable.
