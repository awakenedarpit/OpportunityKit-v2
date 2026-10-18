---
name: Academic Intelligence Modern
colors:
  surface: '#f9f9ff'
  surface-dim: '#ccdafa'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e8eeff'
  surface-container-high: '#dfe8ff'
  surface-container-highest: '#d6e3ff'
  on-surface: '#0c1c33'
  on-surface-variant: '#474555'
  inverse-surface: '#223149'
  inverse-on-surface: '#ecf0ff'
  outline: '#787586'
  outline-variant: '#c8c4d7'
  surface-tint: '#5545da'
  primary: '#4937cf'
  on-primary: '#ffffff'
  primary-container: '#6254e8'
  on-primary-container: '#efebff'
  inverse-primary: '#c5c0ff'
  secondary: '#755a1b'
  on-secondary: '#ffffff'
  secondary-container: '#fdd88c'
  on-secondary-container: '#785d1d'
  tertiary: '#535161'
  on-tertiary: '#ffffff'
  tertiary-container: '#6b697a'
  on-tertiary-container: '#eeeafe'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e3dfff'
  primary-fixed-dim: '#c5c0ff'
  on-primary-fixed: '#140067'
  on-primary-fixed-variant: '#3c26c2'
  secondary-fixed: '#ffdf9e'
  secondary-fixed-dim: '#e5c278'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5b4302'
  tertiary-fixed: '#e4e0f4'
  tertiary-fixed-dim: '#c8c4d7'
  on-tertiary-fixed: '#1b1a28'
  on-tertiary-fixed-variant: '#464555'
  background: '#f9f9ff'
  on-background: '#0c1c33'
  surface-variant: '#d6e3ff'
  surface-bg: '#F7F8FC'
  surface-card: '#FFFFFF'
  border-subtle: '#E3E7F0'
  text-primary: '#17213A'
  text-secondary: '#596780'
  status-eligible: '#10B981'
  status-eligible-bg: '#ECFDF5'
  status-potential: '#F59E0B'
  status-potential-bg: '#FFFBEB'
  status-ineligible: '#EF4444'
  status-ineligible-bg: '#FEF2F2'
  status-unknown: '#6B7280'
  status-unknown-bg: '#F3F4F6'
  dark-bg: '#111827'
  dark-surface: '#182235'
  dark-card: '#202B3D'
  dark-border: '#344158'
  dark-primary: '#9387FF'
  dark-secondary: '#D6B779'
  dark-text-primary: '#F7F8FC'
  dark-text-body: '#D7DEEB'
  dark-text-secondary: '#B8C2D9'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.375rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.625rem
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.625rem
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.25rem
  label-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.25rem
  label-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.025em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-desktop: 1.75rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.25rem
---

## Brand & Style

The design system establishes a high-trust, focused student SaaS environment engineered for clarity, optimism, and academic-professional advancement. Rejecting the playful, game-like clutter typical of youth platforms, it adopts an elevated Minimalist-Modern aesthetic with structural composure, calculated density, and disciplined color restraint. 

The emotional tone balances academic authority with calm reassurance. Users navigate high-stakes discovery—scholarships, competitive fellowships, and research grants—without cognitive fatigue. Surfaces feel breathable, information architecture is rigorous, and visual hierarchy is driven by crisp typographic contrast rather than heavy ornament.

## Colors

The palette is anchored by `#6254E8`, a dynamic electric iris that signals intelligence and forward momentum, balanced against deep slate-navy neutrals (`#17213A`, `#34425B`) that ground the workspace in professional maturity. An understated champagne gold (`#C5A45D`) provides refined secondary emphasis for honors, prestigious badges, and premium grant milestones.

### System Rules
- **Canvas Base**: Use `#F7F8FC` for app-level framing and the Streamlit main view. Reserve pure `#FFFFFF` strictly for raised content modules, card interiors, and active input fields.
- **Accents**: Primary accent `#6254E8` handles primary interactions, active filter pills, and navigation hooks. `#EEEAFE` acts as its supportive resting tint for selected states and category backgrounds.
- **Dark Mode Shift**: In dark mode, backgrounds step down through `#111827` (canvas), `#182235` (panels), and `#202B3D` (interactive cards/inputs), while the accent shifts to `#9387FF` to ensure AA/AAA compliance against slate-tinted surfaces.
- **Semantic Badging**: Status hues (`#10B981`, `#F59E0B`, `#EF4444`, `#6B7280`) are paired with high-tint backgrounds (10-15% saturation) to communicate eligibility cleanly without dominating the page.

## Typography

The type scale integrates the geometric warmth of **Plus Jakarta Sans** for framing and major titles with the utilitarian rigor of **Inter** for dense metadata, criteria lists, and descriptions.

- **Headings**: Plus Jakarta Sans must always feature slight negative tracking (`-0.01em` to `-0.025em`) to maintain editorial polish across large screens and dashboard banners.
- **Readability Rules**: Body text never drops below 13px (`body-sm`), preserving legibility within tight sidebar containers and card footers. Paragraphs should maintain a line length between 55 and 75 characters.
- **Labels & Micro-copy**: Eligibility statuses and categorical tags utilize `label-sm` set to semi-bold with slight uppercase letter spacing (`0.025em`) to ensure immediate scanning across multi-column tables and feed streams.

## Layout & Spacing

The layout is built upon an adaptive 12-column responsive grid paired with an 8pt structural rhythm.

### Grid & Breakpoints
- **Desktop (>=1200px)**: 12-column layout with `2.5rem` outer canvas padding, `1.75rem` gutters. The Streamlit sidebar locks at a maximum width of `320px`, allowing fluid expansion of the primary discovery stream up to `1360px` max-width.
- **Tablet (768px - 1199px)**: 8-column layout with `1.5rem` margins and gutters. Sidebar transitions into an off-canvas drawer or top collapsible filter stack. Cards collapse to 2 columns.
- **Mobile (<768px)**: 4-column layout with `1rem` margins and `1rem` gutters. All opportunity cards, application criteria breakdowns, and action bars stack to full width (1 column).

### Spacing Principles
- Cards maintain internal structural padding of `space-lg` (24px) for desktop and `space-md` (16px) for mobile.
- Section titles decouple from card content using `space-md`, while subheadings remain bound to primary headers via `space-xs`.
- Form groups within the Streamlit sidebar adhere strictly to `space-md` separation between consecutive filter elements.

## Elevation & Depth

Visual hierarchy relies on low-contrast outlines, micro-depth layering, and selective ambient shadows, discarding heavy blur effects or high skeuomorphism.

- **Resting Cards**: Rendered with `#FFFFFF` background, a 1px solid border in `#E3E7F0`, and an ultra-subtle ambient shadow: `0 1px 3px rgba(23, 33, 58, 0.04), 0 1px 2px rgba(23, 33, 58, 0.02)`.
- **Interactive Hover**: Upon cursor hover, cards elevate 2px along the Y-axis, border shifts to `#6254E8` at 35% opacity, and the shadow expands: `0 8px 16px -4px rgba(98, 84, 232, 0.08), 0 4px 6px -2px rgba(23, 33, 58, 0.03)`.
- **Sidebar & Modals**: Filter sidebars utilize flat surface elevation `#FFFFFF` with a crisp right border of `#E3E7F0` without drop shadow to maximize canvas spaciousness. Overlays and dialogs employ `0 20px 25px -5px rgba(23, 33, 58, 0.1), 0 10px 10px -5px rgba(23, 33, 58, 0.04)`.
- **Dark Mode Adaptation**: In dark environments, ambient drop shadows are removed. Depth is communicated strictly via surface lightness steps (`#182235` base to `#202B3D` cards) and 1px crisp borders (`#344158`).

## Shapes

The design system employs a **Rounded** shape language (`roundedness: 2`), applying `0.5rem` (8px) as the structural standard to evoke modern approachability while retaining professional structure.

- **Inputs, Buttons, and Controls**: Styled with standard `0.5rem` corners to conform cleanly with native Streamlit interface patterns.
- **Cards and Containers (`rounded-lg`)**: Structured with `1rem` (16px) corner radius, softening the presentation of dense scholarship data and multi-point requirements.
- **Badges, Tags, and Chips (`rounded-pill`)**: Rendered fully circular/pill-shaped (`9999px`) to immediately signal interactive or categorical metadata distinct from actionable square cards.

## Components

### Buttons
- **Primary**: Solid `#6254E8` with `#FFFFFF` text. Height 40px (desktop), padding `0.5rem 1.25rem`. Radius `0.5rem`. Hover state: `#5244D4` with smooth 150ms transition. Active state: slight inset scale (0.98).
- **Secondary / Outline**: `#FFFFFF` background with 1px border `#E3E7F0`, text `#17213A`. Hover: border `#6254E8`, text `#6254E8`, background `#EEEAFE` at 30% opacity.
- **Ghost**: No border, `#596780` text. Hover: `#F7F8FC` background with `#17213A` text.

### Category & Status Chips
- **Category Badges**: Pill-shaped (`rounded-full`), height 24px, padding `0.25rem 0.75rem`. Text `label-sm`.
  - *Internship*: Neutral slate tint (`#F1F3F9` / `#34425B`).
  - *Scholarship*: Champagne accent tint (`#FBF7EE` / `#947633`).
  - *Hackathon / Fellowship*: Primary tint (`#EEEAFE` / `#6254E8`).
- **Eligibility Status Badges**:
  - *Eligible*: Text `#047857`, background `#ECFDF5`, border 1px solid `#A7F3D0`. Includes a 6px solid circular green status indicator dot.
  - *Potentially Eligible*: Text `#B45309`, background `#FFFBEB`, border 1px solid `#FDE68A`.
  - *Not Eligible*: Text `#B91C1C`, background `#FEF2F2`, border 1px solid `#FECACA`.
  - *Insufficient Info*: Text `#4B5563`, background `#F3F4F6`, border 1px solid `#E5E7EB`.

### Cards (Opportunity Item)
- Surface: `#FFFFFF` with 1px solid `#E3E7F0` border. Radius: `1rem`. Internal padding: `1.5rem`.
- Layout: Top header accommodates title (`headline-sm`), host organization (`body-sm`), and right-aligned eligibility chip.
- Center section: 2-line snippet (`body-md`), followed by horizontal flex wrap of category, deadline, and funding tags (`space-sm` gap).
- Footer: Separated by a 1px `#E3E7F0` divider, housing deadline countdown, bookmark trigger, and the primary "View Details / AI Match Breakdown" button.

### Input Fields & Filter Controls
- Surface `#FFFFFF`, border 1px solid `#E3E7F0`, radius `0.5rem`, height 42px, padding `0.625rem 0.875rem`. Text: `body-md` in `#17213A`. Placeholder: `#596780`.
- Focus state: Border transitions to `#6254E8` with a 3px ring of `rgba(98, 84, 232, 0.15)`.
- Streamlit dropdowns and multiselects feature selected pills in `#EEEAFE` with `#6254E8` font and removal icons.

### AI Match Summary Panel
- Surface: Linear gradient from `#FFFFFF` to `#FAF9FE` with a distinct left accent border (3px solid `#6254E8`).
- Houses a concise percentage/match-confidence score set in `headline-md` alongside clear bullet points explaining criteria fulfillment.