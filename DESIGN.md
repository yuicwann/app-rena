---
name: Playful Classroom
colors:
  surface: "#fbf9f9"
  surface-dim: "#dbdad9"
  surface-bright: "#fbf9f9"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f5f3f3"
  surface-container: "#efeded"
  surface-container-high: "#e9e8e7"
  surface-container-highest: "#e3e2e2"
  on-surface: "#1b1c1c"
  on-surface-variant: "#3f4a36"
  inverse-surface: "#303031"
  inverse-on-surface: "#f2f0f0"
  outline: "#6f7b64"
  outline-variant: "#becbb1"
  surface-tint: "#2b6c00"
  primary: "#2b6c00"
  on-primary: "#ffffff"
  primary-container: "#58cc02"
  on-primary-container: "#1e5000"
  inverse-primary: "#6be026"
  secondary: "#006590"
  on-secondary: "#ffffff"
  secondary-container: "#2fb8ff"
  on-secondary-container: "#004666"
  tertiary: "#755b00"
  on-tertiary: "#ffffff"
  tertiary-container: "#ddad00"
  on-tertiary-container: "#574300"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  primary-fixed: "#87fe45"
  primary-fixed-dim: "#6be026"
  on-primary-fixed: "#082100"
  on-primary-fixed-variant: "#1f5100"
  secondary-fixed: "#c8e6ff"
  secondary-fixed-dim: "#88ceff"
  on-secondary-fixed: "#001e2e"
  on-secondary-fixed-variant: "#004c6e"
  tertiary-fixed: "#ffdf92"
  tertiary-fixed-dim: "#f4bf00"
  on-tertiary-fixed: "#241a00"
  on-tertiary-fixed-variant: "#594400"
  background: "#fbf9f9"
  on-background: "#1b1c1c"
  surface-variant: "#e3e2e2"
  storybook-green: "#d7ffb8"
  fresh-leaf: "#a5ed6e"
  night-ink: "#000437"
  paper-white: "#ffffff"
  charcoal: "#4b4b4b"
  pencil-gray: "#777777"
  faded-gray: "#e5e5e5"
  sunny-gold: "#ffc800"
  green-press-shadow: "#58a700"
  blue-press-shadow: "#1899d6"
typography:
  display-lg:
    fontFamily: Nunito Sans
    fontSize: 40px
    fontWeight: "800"
    lineHeight: 48px
  display-lg-mobile:
    fontFamily: Nunito Sans
    fontSize: 32px
    fontWeight: "800"
    lineHeight: 40px
  headline-lg:
    fontFamily: Nunito Sans
    fontSize: 28px
    fontWeight: "800"
    lineHeight: 36px
  headline-md:
    fontFamily: Nunito Sans
    fontSize: 24px
    fontWeight: "700"
    lineHeight: 32px
  headline-sm:
    fontFamily: Nunito Sans
    fontSize: 20px
    fontWeight: "700"
    lineHeight: 28px
  body-lg:
    fontFamily: Nunito Sans
    fontSize: 18px
    fontWeight: "500"
    lineHeight: 26px
  body-md:
    fontFamily: Nunito Sans
    fontSize: 16px
    fontWeight: "500"
    lineHeight: 24px
  body-sm:
    fontFamily: Nunito Sans
    fontSize: 14px
    fontWeight: "500"
    lineHeight: 20px
  label-lg:
    fontFamily: Nunito Sans
    fontSize: 16px
    fontWeight: "700"
    lineHeight: 20px
  label-md:
    fontFamily: Nunito Sans
    fontSize: 14px
    fontWeight: "700"
    lineHeight: 18px
  label-sm:
    fontFamily: Nunito Sans
    fontSize: 12px
    fontWeight: "700"
    lineHeight: 16px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

# Duolingo — Style Reference

> Playful classroom mascot on white paper
> **Theme:** light

Duolingo's interface treats the page like a children's storybook: white paper canvas, chubby rounded display type, and a single saturated green that reads as 'correct answer' the moment it appears. Body copy stays calm in mid-gray so the green and its accent blue can do all the emotional work. Components are pill-shaped or chunky-rounded with thick 2px borders and tactile sticker-like 3D buttons (`border-b-4`).

## Tokens — Colors

| Name            | Value     | Token                     | Role                                                             |
| --------------- | --------- | ------------------------- | ---------------------------------------------------------------- |
| Eager Green     | `#58cc02` | `--color-eager-green`     | Green CTA fills, success badges, active module progress          |
| Storybook Green | `#d7ffb8` | `--color-storybook-green` | Soft highlight wash, active milestone backgrounds                |
| Spark Blue      | `#1cb0f6` | `--color-spark-blue`      | Interactive secondary buttons, frequency badges, link highlights |
| Fresh Leaf      | `#a5ed6e` | `--color-fresh-leaf`      | Accent tags, signal frequency wave peaks                         |
| Night Ink       | `#000437` | `--color-night-ink`       | Deep high-contrast titles, dark accents                          |
| Paper White     | `#ffffff` | `--color-paper-white`     | Page canvas, card surfaces                                       |
| Charcoal        | `#4b4b4b` | `--color-charcoal`        | Primary dark headings, text titles                               |
| Pencil Gray     | `#777777` | `--color-pencil-gray`     | Secondary text, module descriptions                              |
| Faded Gray      | `#e5e5e5` | `--color-faded-gray`      | Locked module borders and surfaces, disabled states              |
| Sunny Gold      | `#ffc800` | `--color-sunny-gold`      | Streak icons, XP stars, trophy points                            |

## Tokens — Typography

- Display: 'Nunito', 'Feather Bold', ui-sans-serif, sans-serif (Rounded, heavy, playful)
- Body: 'Nunito', 'DIN Next', 'Inter', ui-sans-serif, sans-serif (Rounded, crisp 500 & 700)

## Spacing & Shapes

- Radius: 16px - 24px (Pill and chunky rounded cards)
- Buttons: 3D sticker press effect (`box-shadow: 0 4px 0 #58a700`, `border-b-4`)
