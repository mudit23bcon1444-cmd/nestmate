---
name: Warm Hearth Modern
colors:
  surface: '#fff8f6'
  surface-dim: '#eed5cd'
  surface-bright: '#fff8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1ed'
  surface-container: '#ffe9e3'
  surface-container-high: '#fde3db'
  surface-container-highest: '#f7ddd5'
  on-surface: '#261814'
  on-surface-variant: '#594139'
  inverse-surface: '#3c2d28'
  inverse-on-surface: '#ffede8'
  outline: '#8d7168'
  outline-variant: '#e1bfb5'
  surface-tint: '#ab3500'
  primary: '#ab3500'
  on-primary: '#ffffff'
  primary-container: '#ff6b35'
  on-primary-container: '#5f1900'
  inverse-primary: '#ffb59d'
  secondary: '#7c5638'
  on-secondary: '#ffffff'
  secondary-container: '#fdcaa4'
  on-secondary-container: '#785335'
  tertiary: '#00677e'
  on-tertiary: '#ffffff'
  tertiary-container: '#00a7cb'
  on-tertiary-container: '#003744'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd0'
  primary-fixed-dim: '#ffb59d'
  on-primary-fixed: '#390c00'
  on-primary-fixed-variant: '#832600'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#eebd97'
  on-secondary-fixed: '#2e1500'
  on-secondary-fixed-variant: '#613f23'
  tertiary-fixed: '#b5ebff'
  tertiary-fixed-dim: '#59d5fb'
  on-tertiary-fixed: '#001f28'
  on-tertiary-fixed-variant: '#004e60'
  background: '#fff8f6'
  on-background: '#261814'
  surface-variant: '#f7ddd5'
typography:
  h1:
    fontFamily: Poppins
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Poppins
    fontSize: 36px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Poppins
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  button:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  xxxl: 64px
---

## Brand & Style

This design system is built to evoke a sense of "home-coming" for students navigating the often stressful process of finding housing. The aesthetic direction is **Modern-Warm**, blending the reliability of a professional real estate platform with the approachability of a lifestyle brand. 

By utilizing a high-contrast palette of sunset oranges and deep navies against a soft, creamy background, the UI moves away from the sterile "tech-blue" look typical of the industry. The style prioritizes clarity, comfort, and ease of use, ensuring that information-heavy listings feel breathable and inviting rather than overwhelming.

## Colors

The color palette is grounded in warmth. 
- **Primary (#FF6B35):** Used for main actions, brand identity, and critical UI highlights.
- **Secondary (#F7C59F) & Accent (#FFBE0B):** Reserved for supporting elements like badges, category filters, and decorative accents to maintain a sun-drenched, optimistic mood.
- **Background & Text:** The "Warm White" background reduces eye strain compared to pure white, while the "Deep Navy" text provides high-contrast legibility without the harshness of pure black.

Use secondary colors for low-priority background fills (e.g., tags or secondary buttons) to create a soft, layered hierarchy.

## Typography

This design system utilizes a two-font pairing to balance personality with utility. 
- **Poppins** is the headline workhorse; its geometric and friendly curves project an approachable, modern energy. Use it for all major headings and large-scale marketing copy.
- **Inter** is employed for all body text, inputs, and UI labels. Its high x-height and neutral character ensure maximum readability for long property descriptions and dense data tables.

Maintain a tight vertical rhythm by adhering to the defined line heights, ensuring that all text blocks align with the 8px spacing grid.

## Layout & Spacing

The design system follows a strict **8px spacing grid**. All margins, paddings, and component heights should be multiples of 8 to ensure visual mathematical harmony.

The layout utilizes a **12-column fixed grid** for desktop, centering the content at a maximum width of 1280px. This provides a stable, professional structure for property listing grids. For mobile views, the grid collapses to a single column with 16px side margins. 

Internal component spacing (like card padding) should prioritize the `md (16px)` and `lg (24px)` units to maintain a spacious, premium feel that mirrors the airy interiors of the homes being listed.

## Elevation & Depth

To maintain a soft and modern aesthetic, this design system avoids harsh black shadows. Depth is instead conveyed through **Ambient Warm Shadows** and subtle tonal layering.

- **Low Elevation:** Use a single-pixel subtle border (`#F7C59F` at 20% opacity) for interactive elements like input fields and inactive cards.
- **Medium Elevation:** The primary shadow for listing cards uses `0px 4px 20px rgba(255, 107, 53, 0.12)`. This creates a soft glow that feels light and "lifted" from the warm white background.
- **High Elevation:** For modals or floating action buttons, use a stacked shadow with increased spread to simulate height, maintaining the warm orange tint to stay consistent with the brand's lighting model.

## Shapes

The shape language is defined by "nested softness." 
- **Container Elements:** Larger structural components like property cards and containers utilize a **16px border-radius**. This softens the grid and makes the interface feel more organic and less rigid.
- **Interactive Elements:** Small-scale interactive components like buttons, input fields, and checkboxes use an **8px border-radius**. This sharper (yet still rounded) radius provides a more precise and professional feel for areas requiring user input.

Always ensure that when an 8px-radius element is nested inside a 16px-radius container, the internal padding is sufficient to prevent visual "cramping" of the curves.

## Components

### Buttons
Primary buttons use a solid `#FF6B35` fill with white text and an 8px radius. Secondary buttons should use a ghost style with a 1px border of the primary color or a light `#F7C59F` background fill.

### Cards
Listing cards are the core of this design system. They must feature a 16px radius, the signature soft warm shadow, and a white surface. Images within cards should have their top corners rounded to 16px to match the container.

### Inputs
Search bars and form fields use an 8px radius and a subtle `#F7C59F` border. On focus, the border color shifts to the primary `#FF6B35` with a 2px stroke.

### Badges & Chips
Use `#FFBE0B` (Amber) for "Featured" or "New" badges to catch the eye. Use light peach tints for amenity chips (e.g., "WiFi", "AC", "Laundry") to keep the information dense but readable.

### Additional Components
- **Price Tags:** Large, bold typography using the primary color to ensure immediate visibility.
- **Availability Toggle:** A custom-styled switch using the primary color for the 'on' state, helping students quickly filter by move-in dates.