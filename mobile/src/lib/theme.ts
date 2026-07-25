/**
 * eMSME Design System — Centralized Theme Tokens
 *
 * Single source of truth for colors, typography, shadows, spacing, and motion.
 * Always import from here — never hardcode values in components.
 */

// ---------------------------------------------------------------------------
// COLOR PALETTE
// Calibrated: saturation < 80%, no pure black/white, one accent family.
// ---------------------------------------------------------------------------
export const colors = {
  // Primary — Philippine Blue (desaturated from raw #0038A8)
  primary: '#1B4FDB',
  primaryDark: '#143BB0',      // pressed / dark variant
  primaryMuted: '#E8ECF8',    // container fill, icon bg
  primarySubtle: '#F2F4FC',   // section backgrounds

  // Signal — destructive / required markers (desaturated from raw red)
  signal: '#C9372C',
  signalMuted: '#FDECEA',

  // Amber — warnings / secondary accents (desaturated)
  amber: '#C4882E',
  amberMuted: '#FDF3E4',

  // Gold accent — Philippine flag (used sparingly in flag bar only)
  gold: '#F5C842',

  // Surfaces — warm off-whites, never pure #FFFFFF as a page background
  surface: '#F8F9FB',         // page / scroll background
  surfaceRaised: '#FFFFFF',   // cards, elevated surfaces
  surfaceOverlay: 'rgba(255,255,255,0.92)',

  // Text hierarchy
  ink: '#161618',             // primary text — off-black (never #000000)
  body: '#545459',            // secondary / body text
  caption: '#8A8A8F',         // captions, metadata, placeholders
  placeholder: '#B0B0B6',

  // Structural
  border: '#E4E4E7',          // card/input borders
  borderSubtle: '#F0F0F2',    // intra-card dividers
  divider: '#EBEBEE',

  // Static
  white: '#FFFFFF',
  transparent: 'transparent',
} as const;

// ---------------------------------------------------------------------------
// SHADOWS — Tinted to background hue (never generic rgba(0,0,0,x))
// ---------------------------------------------------------------------------
export const shadows = {
  // Soft card shadow — blue-tinted
  card: {
    shadowColor: '#1B4FDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  // Elevated card — for hero/featured cards
  cardElevated: {
    shadowColor: '#1B4FDB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 6,
  },
  // Button shadow — subtle bottom drop
  button: {
    shadowColor: '#143BB0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  // Tab bar / floating elements
  float: {
    shadowColor: '#1B4FDB',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  // Amber-tinted for alert/warning cards
  amber: {
    shadowColor: '#C4882E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

// ---------------------------------------------------------------------------
// BORDER RADIUS — Concentric system (outer > inner, always)
// ---------------------------------------------------------------------------
export const radius = {
  xs: 6,    // tags, badges, inner chips
  sm: 10,   // inputs, small buttons
  md: 14,   // inner card content area
  lg: 20,   // card containers (outer shell)
  xl: 28,   // modals, bottom sheets
  full: 9999,
} as const;

// ---------------------------------------------------------------------------
// SPACING — 4pt grid
// ---------------------------------------------------------------------------
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  screen: 20, // horizontal screen padding
} as const;

// ---------------------------------------------------------------------------
// TYPOGRAPHY — Plus Jakarta Sans + JetBrains Mono
// Never hardcode font family strings in components — use these.
// ---------------------------------------------------------------------------
export const fonts = {
  display: 'PlusJakartaSans_700Bold',
  heading: 'PlusJakartaSans_600SemiBold',
  medium: 'PlusJakartaSans_500Medium',
  sans: 'PlusJakartaSans_400Regular',
  mono: 'JetBrainsMono_400Regular',  // numerals, currencies, data
  monoMedium: 'JetBrainsMono_500Medium',
} as const;

// Preset text styles — combine with colors as needed
export const text = {
  h1: { fontFamily: fonts.display, fontSize: 28, letterSpacing: -0.5 },
  h2: { fontFamily: fonts.display, fontSize: 22, letterSpacing: -0.3 },
  h3: { fontFamily: fonts.heading, fontSize: 18, letterSpacing: -0.2 },
  h4: { fontFamily: fonts.heading, fontSize: 15, letterSpacing: -0.1 },
  body: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 22 },
  bodyMd: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 24 },
  label: { fontFamily: fonts.medium, fontSize: 13 },
  labelSm: { fontFamily: fonts.medium, fontSize: 11 },
  caption: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 18 },
  // Monospace — always use for currency, IDs, dates, codes
  mono: { fontFamily: fonts.mono, fontSize: 14 },
  monoLg: { fontFamily: fonts.mono, fontSize: 22, letterSpacing: -0.5 },
  monoXl: { fontFamily: fonts.mono, fontSize: 28, letterSpacing: -1 },
  // Tab bar label
  tabLabel: { fontFamily: fonts.medium, fontSize: 11 },
} as const;

// ---------------------------------------------------------------------------
// SPRING PHYSICS — All interactive motion uses spring (no linear easing)
// ---------------------------------------------------------------------------
export const spring = {
  // Standard UI interactions — buttons, cards
  standard: { type: 'spring', stiffness: 120, damping: 18 } as const,
  // Snappy — tab switches, quick toggles
  snappy: { type: 'spring', stiffness: 180, damping: 20 } as const,
  // Gentle — list entry, page transitions
  gentle: { type: 'spring', stiffness: 80, damping: 16 } as const,
  // Overshoot — badges, status pops (slightly bouncy)
  overshoot: { type: 'spring', stiffness: 200, damping: 15 } as const,
} as const;

// ---------------------------------------------------------------------------
// ANIMATION TIMING — Stagger delays for list/grid reveals
// ---------------------------------------------------------------------------
export const stagger = {
  base: 60,   // ms between each list item (60ms * index)
  fast: 40,   // for dense lists
  slow: 100,  // for hero/feature sections
} as const;

// ---------------------------------------------------------------------------
// FLAG ACCENT — Philippine flag stripe colors
// ---------------------------------------------------------------------------
export const flagStripes = [
  colors.primary,  // Blue
  colors.signal,   // Red
  colors.gold,     // Gold/Yellow
] as const;
