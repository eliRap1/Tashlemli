---
name: Tashlemli High-Trust Direct
asset_id: assets/fe5b903c88b048cb93078746e5a408d0
project: Tashlemli Flight Compensation
project_id: 11723134529212088717
colors:
  surface: '#fcf8f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf8f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0edec'
  surface-container-high: '#ebe7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#44474e'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#74777f'
  outline-variant: '#c4c6cf'
  surface-tint: '#495f82'
  primary: '#001026'
  on-primary: '#ffffff'
  primary-container: '#0b2545'
  on-primary-container: '#778db2'
  inverse-primary: '#b1c7f0'
  secondary: '#506600'
  on-secondary: '#ffffff'
  secondary-container: '#c2f02e'
  on-secondary-container: '#546b00'
  tertiary: '#2b0001'
  on-tertiary: '#ffffff'
  tertiary-container: '#530002'
  on-tertiary-container: '#ec5d4f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#b1c7f0'
  on-primary-fixed: '#001c3b'
  on-primary-fixed-variant: '#314769'
  secondary-fixed: '#c5f331'
  secondary-fixed-dim: '#aad600'
  on-secondary-fixed: '#161f00'
  on-secondary-fixed-variant: '#3b4d00'
  tertiary-fixed: '#ffdad5'
  tertiary-fixed-dim: '#ffb4aa'
  on-tertiary-fixed: '#410001'
  on-tertiary-fixed-variant: '#8c1713'
  background: '#fcf8f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
brand-overrides:
  primary: '#0B2545'
  secondary: '#C6F432'
  tertiary: '#FF6B5C'
  neutral: '#0A0A0A'
typography:
  display-hero:
    fontFamily: Heebo
    fontSize: 96px
    fontWeight: '800'
    lineHeight: '1.0'
    letterSpacing: -0.04em
  display-lg:
    fontFamily: Heebo
    fontSize: 60px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Heebo
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  body-base:
    fontFamily: Heebo
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Heebo
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  english-fallback:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  section-gap: 80px
  stack-sm: 12px
  stack-md: 24px
---

## Brand & Style

This design system balances the clinical authority of a premium financial institution with the energetic, "on-your-side" spirit of a consumer advocacy group. The aesthetic is categorized as **Corporate / Modern** with elements of **High-Contrast Bold** to ensure the brand feels both legally formidable and approachable for the everyday traveler.

The UI should evoke a sense of relief and competence. It utilizes heavy typography and a restricted color palette to communicate stability, while the vibrant accent color provides the "scrappy" momentum needed to signal quick action and successful payouts. The visual language is optimized for the Israeli market, prioritizing clarity, speed of information, and a distinct "local" feel through specific iconography and RTL-first architectural decisions.

## Colors

The palette is engineered for high trust and immediate recognition.

- **Primary (Deep Navy `#0B2545`):** Used for structural elements, headers, and primary branding to establish a "bank-grade" foundation of security.
- **Accent (Bright Lime `#C6F432`):** Reserved strictly for conversion points, "money back" indicators, and primary CTAs. This creates a high-contrast "vibration" against the navy, signaling movement and value.
- **Background (Off-white `#FCF8F8`):** A softer alternative to pure white, reducing eye strain and providing a premium, paper-like quality to the digital interface.
- **Alert (Warm Coral `#FF6B5C`):** Used for error states, missed flight notifications, and urgent "Action Required" flags, distinct enough from the lime to prevent user confusion.

## Typography

The typography system is dual-language optimized. For Hebrew, **Heebo** provides a rounded, modern professional look that avoids the stiffness of traditional legal fonts. Headlines are designed to be massive and impactful, utilizing tight tracking to mimic the "breaking news" style of consumer advocacy.

For English text and technical labels, **Inter** is utilized for its superior legibility in small UI components and its systematic, functional feel.

**Note on hierarchy:** Display headings must always use the Deep Navy color to maintain authority. Body text utilizes Near-Black (`#0A0A0A`) for maximum readability against the off-white background.

## Layout & Spacing

This design system employs a **Fixed Grid** model for desktop environments (12-column) and a **Fluid Grid** for mobile. The layout is strictly RTL (Right-to-Left) optimized, ensuring that the visual weight and focal points are correctly aligned for Hebrew readers.

Generous whitespace is used to prevent the "cluttered legal" look. Sections are separated by large gaps to allow the "scrappy" imagery (airport silhouettes and traveler photography) to breathe. Content containers should be centered with a maximum width of 1280px to maintain readability on ultra-wide monitors.

## Elevation & Depth

To maintain the "Trustworthy Bank" persona, the design system avoids trendy, overly-aggressive depth. Instead, it uses:

- **Tonal Layering:** Differentiation between sections is primarily achieved through subtle shifts in background color (e.g., swapping between `#FAFAF7` and pure `#FFFFFF`).
- **Ambient Shadows:** Cards and primary containers use very soft, diffused shadows (`0px 4px 20px`, 5% opacity of Navy) to lift them slightly off the page without appearing "floaty."
- **Interactive Depth:** On hover, buttons and cards may transition to a slightly deeper shadow or a subtle 1px border in Navy to provide tactile feedback.

## Shapes

The shape language is "Friendly Professional." Elements utilize a **Rounded (level 2)** setting, which translates to 0.5rem (8px) for standard components like input fields and buttons, and up to 1.5rem (24px) for large content cards and hero image containers.

This roundedness softens the brand's legal edge, making the "scrappy" consumer-facing side feel more inviting and less intimidating. Circular motifs may be used for progress indicators or airport-code badges to mimic airline branding.

## Components

### Buttons
Primary action buttons use the **Bright Lime** background with **Deep Navy** text. They are bold, uppercase (for English) or extra-bold (for Hebrew), and feature 8px rounded corners. Secondary buttons use a Navy outline with no fill.

### Input Fields
Inputs are clean, featuring a 1px border in a light grey-navy tint. Upon focus, the border thickens to 2px in Deep Navy. Labels always sit above the input in the `label-bold` style.

### Cards
Cards are the primary container for claim details and flight information. They utilize the `#FFFFFF` background against the `#FAFAF7` page background, with the subtle ambient shadow described in the Elevation section.

### Compensation Progress Tracker
A custom component unique to the brand. It uses a horizontal line with circular nodes. Completed steps are filled with Bright Lime; the current step pulses with a soft Navy glow.

### Imagery Containers
Photos of travelers should always feature slightly rounded corners (24px) and may occasionally use a Deep Navy "cut-out" silhouette overlay of a control tower or airplane tail to reinforce the airport context.
