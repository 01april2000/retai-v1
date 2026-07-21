---
name: Luminous Linear
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#434655'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#943700'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-margin: 1.25rem
  stack-gap-sm: 0.5rem
  stack-gap-md: 1rem
  stack-gap-lg: 1.5rem
  touch-target-min: 44px
---

## Brand & Style

This design system is built on the principles of **Minimalism** and **Modern Functionalism**. Designed specifically for a mobile-first product management experience, it prioritizes clarity, speed of intent, and reduced cognitive load. 

The aesthetic is defined by "breathing room"—generous whitespace that separates high-density data, ensuring that CRUD operations feel effortless rather than clinical. The emotional response is one of calm productivity; the UI recedes to let the product data take center stage. Visual hierarchy is established through subtle tonal shifts and precise typography rather than heavy decorative elements.

## Colors

The palette is anchored in a high-clarity "Paper & Ink" philosophy. 
- **Primary:** A vibrant, high-contrast blue reserved exclusively for primary actions (Create, Save, Commit) to provide a clear "north star" for the user's thumb.
- **Neutral/Surface:** A range of ultra-light greys used to create subtle depth without the weight of traditional borders. 
- **Success/Error:** Reserved for status indicators (In Stock, Out of Stock) and critical feedback.

Avoid using the primary color for non-interactive decorative elements to maintain the integrity of the action-oriented system.

## Typography

Using **Hanken Grotesk** across all roles provides a cohesive, engineered feel that suits a management system. 
- **Headlines:** Use tight letter-spacing and bold weights to anchor page sections.
- **Labels:** Small caps or uppercase labels should be used for metadata headers (e.g., "SKU", "STOCK LEVEL") to differentiate from user-generated content.
- **Body:** Ensure a minimum of 16px for input text to prevent iOS auto-zoom on focus.

## Layout & Spacing

The layout follows a **Fluid Mobile Grid** with a 4-column structure. 
- **Margins:** A consistent 20px (1.25rem) safe area on the left and right edges.
- **Rhythm:** Use an 8px base unit. Vertical spacing between card elements should be 12px, while spacing between distinct sections should be 24px or 32px.
- **Density:** Maintain "Loose Density." In a list of products, vertical padding within the row should be at least 16px to ensure the interface feels accessible and touch-friendly.

## Elevation & Depth

This system avoids heavy shadows in favor of **Tonal Layers** and **Low-Contrast Outlines**.
- **Surface Level 0:** The main background, using the neutral light grey.
- **Surface Level 1:** White cards or containers that house product details. Use a 1px solid border in `#E2E8F0` rather than a shadow to define edges.
- **Interactive Depth:** Only the "Primary Action Button" (FAB or bottom-docked button) receives a soft, diffused shadow (10% opacity of the primary color) to indicate it sits above the content.
- **Modal Overlays:** Use a subtle backdrop blur (8px) with a 20% black tint to maintain context while focusing on a CRUD sub-task.

## Shapes

The design system utilizes **Rounded** geometry to soften the technical nature of management software.
- **Standard Radius:** 8px (0.5rem) for cards and input fields.
- **Large Radius:** 16px (1rem) for bottom sheets and large container groups.
- **Full Radius:** Used for status badges and circular icon buttons to create visual distinction from data fields.

## Components

### Buttons
- **Primary:** Full-width mobile buttons with the primary color and white text. Height should be exactly 52px for optimal thumb ergonomics.
- **Ghost:** Used for "Cancel" or "Secondary" actions, using the secondary text color with no background.

### Input Fields
- **Floating Labels:** To save vertical space, use floating labels or high-contrast placeholder text that transitions to a label.
- **Focus State:** On focus, the 1px border transitions to the primary color with a 2px outer glow of 10% opacity.

### Product Cards
- Cards should be white with an 8px radius. 
- Information hierarchy within the card: Title (Headline-MD), Subtext (Body-MD), and Status (Label-MD in a pill badge).

### Chips/Badges
- Small, high-radius pills. Use light tints of success/error colors with darker text (e.g., light green background with dark green text) for readability.

### Floating Action Button (FAB)
- Since this is a CRUD system, a single FAB for "Add New Product" should be positioned in the bottom right, using the primary color and a simple "Plus" icon.