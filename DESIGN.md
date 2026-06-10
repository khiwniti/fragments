---
name: khiw.dev Fragments
description: Dark, code-editor-native AI app builder. Monospace first-class. One accent, used with intent.
colors:
  surface-base: "#061224"
  surface-card: "#0e1620"
  surface-popover: "#08111d"
  surface-elevated: "#161e2a"
  surface-accent: "#1c2531"
  border-default: "#1f2229"
  ink-strong: "#d8dfe7"
  ink-muted: "#9fa6b0"
  accent-primary: "#3ee5a4"
  destructive: "#871f1f"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Geist, system-ui, sans-serif"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontWeight: 500
    letterSpacing: "0.01em"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontWeight: 400
    lineHeight: 1.5
  mono-eyebrow:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontWeight: 500
    fontSize: "10px"
    letterSpacing: "0.15em"
    textTransform: "uppercase"
rounded:
  sm: "6px"
  md: "10px"
  lg: "20px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "40px"
  3xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.accent-primary}"
    textColor: "{colors.surface-base}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.accent-primary}"
    textColor: "{colors.surface-base}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-strong}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  button-icon-pill:
    backgroundColor: "{colors.accent-primary}"
    textColor: "{colors.surface-base}"
    rounded: "{rounded.lg}"
    size: "40px"
  input-default:
    backgroundColor: "{colors.surface-base}"
    textColor: "{colors.ink-strong}"
    rounded: "{rounded.lg}"
    padding: "10px 12px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink-strong}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
---

# Design System: khiw.dev Fragments

## 1. Overview

**Creative North Star: "The Code Editor with a Chat Panel"**

The interface reads as a code editor that grew a chat panel — the same dark surface, the same monospace as a first-class citizen, the same restraint about what earns a glow. The portfolio's home page is the cover sheet; `/chat` is the workbench; the source code is the receipt. Every surface is dual-purpose: it has to communicate competence to a portfolio visitor in under a minute, and it has to disappear into a long developer session in `/chat`.

The system is **sharp, technical, AI-native** — three words borrowed from `PRODUCT.md`. Personality over decoration. Density over breathing room. One accent (Bio Emerald) used surgically, never as wallpaper. The interface is fluent in the category's best tools (Linear, Vercel, Raycast, Replit) and would never make a developer stop to wonder what an affordance does.

This system explicitly rejects:
- **Cursor / Devin / bolt.new** — chat-bubble hero, fake-typing indicators, mascot characters, "magical" language, glowing borders. Substance over spectacle.
- **Indie maker / Vercel-template** — gradient-text headline, three feature cards in a row, social-proof avatars, "Get started in 30 seconds" copy.
- **Generic SaaS dark dashboard** — rounded-everything, gradient buttons, identical card grids, hero with three icons and a CTA.

**Key Characteristics:**
- Dark by default. Single dark theme; light mode is a `--class` toggle that no surface currently uses.
- Tonal layering (background → card → popover → secondary) carries hierarchy; shadows are reserved for state.
- One saturated color, used for selection / primary action / current state only.
- Monospace (JetBrains Mono) for code, prompts, timestamps, file names, technical labels — not for body.
- Type and motion are quiet. The user does the work; the interface doesn't perform.

## 2. Colors

The palette is a single cool-blue tonal ramp from near-black to pale gray, with one emerald accent and one deep-red destructive. The hue (218° in HSL) tints the neutral surface; the chroma is low so the surfaces read as "dark", not "blue". The emerald is the only saturated color, and its rarity is the point.

### Primary
- **Bio Emerald** (`#3ee5a4`, `hsl(152 68% 55%)`): The only saturated color in the system. Used for primary actions, current selection, the focused input border, the active sidebar item, the send button. Reads as a tool that is alive and watching the work. Tailwind `emerald-400` (`#34d399`) is reserved for utility classes (`.text-accent-dim`, `.bg-accent-surface`, `.border-accent-hover`, `.glow-accent`); the CSS-variable primary is the canonical accent.

### Destructive
- **Structural Red** (`#871f1f`, `hsl(0 63% 31%)`): Error states only. The `bg-destructive` button is the only place the destructive token surfaces. Error toasts use `bg-red-400/10` + `text-red-400` for translucency.

### Neutral (cool-tinted, hue 218°)
- **Deep Slate Base** (`#061224`, `hsl(218 55% 7%)`): The body background. Cool blue-black with a slight blue lean; the highest chroma neutral in the system.
- **Cool Card** (`#0e1620`, `hsl(218 40% 9%)`): The card surface. Slightly lighter than base; one tonal step up.
- **Cool Popover** (`#08111d`, `hsl(218 50% 8%)`): The popover surface. Sits between base and card in lightness but is *darker* than card (closer to base) so a popover reads as a recessed inset, not a lifted card.
- **Cool Secondary** (`#161e2a`, `hsl(218 35% 11%)`): A second neutral layer for the chat sidebar, code blocks, and toolbars. The chroma is lower than card so the secondary surface reads as a working area, not a presentation card.
- **Cool Accent** (`#1c2531`, `hsl(218 35% 13%)`): A hover/selected state for surfaces that should respond but not glow. Used as `hover:bg-accent` on ghost buttons and list rows.
- **Cool Border** (`#1f2229`, `hsl(218 20% 13%)`): The default 1px border. Lower chroma than the surfaces, so borders read as dividers, not as colored edges.
- **Ink Strong** (`#d8dfe7`, `hsl(214 32% 91%)`): Body text and headlines. Cool off-white with a slight blue lean to match the surface hue.
- **Ink Muted** (`#9fa6b0`, `hsl(215 16% 65%)`): Secondary text, helper text, timestamps, file metadata. Hits 4.5:1 on `--surface-base` and `--surface-card`.

### Named Rules

**The Bio Emerald Rule.** The primary accent is used on ≤10% of any given screen. Its rarity is the point. The accent is reserved for selection, primary action, current state, and the focused-input border. It does not glow, does not gradient, and does not appear as decoration.

**The No-Glow Rule.** No `box-shadow` with a saturated color. No `filter: drop-shadow()` on the emerald. The accent communicates through presence, not through radiance. (`glow-accent` utility exists in `globals.css` but is reserved for explicit opt-in moments — never applied to a primary button by default.)

**The Tonal Layering Rule.** Hierarchy is conveyed by surface tone, not by shadow. Background → Card → Popover → Secondary → Accent is a five-step ramp; each step is ≤5% lightness apart. Shadows (`shadow-sm`, `shadow-md` in the shadcn button) are allowed only as state response on a button or a focus ring on an input.

## 3. Typography

**Display / Body / Label Font:** Geist Sans (`Geist, system-ui, sans-serif`) — weights 400, 500, 600, 700. Vercel's open-source technical sans, designed for code UIs and AI tooling. Preloaded via `next/font/google` as `--font-sans`. The default is the most legible of the weights; 500 for labels, 600 for titles and headlines, 700 for display.

**Mono Font:** Geist Mono (`Geist Mono, ui-monospace, monospace`) — weights 400, 500. Preloaded via `next/font/google` as `--font-mono`. Used for code, prompts, timestamps, file names, version metadata, footer attribution. Designed as the pair to Geist Sans; together they read as one family.

**Character:** Neutral, technical, and quiet. The personality comes from copy and layout, not from the type. Geist Sans reads as sharp without being aggressive; Geist Mono reads as code without being decorative. The pair scales from a 10px eyebrow to a 44px display heading without re-tuning.

### Hierarchy
- **Display** (700, `clamp(26px, 4.5vw, 44px)`, line-height 1.1): Hero h1 only (`HeroChat`, the resume page). One per surface.
- **Headline** (600, `text-lg` / `text-xl` / `text-2xl`, line-height 1.2–1.3): Section headings, widget titles, panel labels.
- **Title** (600, `text-sm` / `text-base`, line-height 1.3): Sidebar items, dialog titles, card titles.
- **Body** (400, `text-sm` / `text-base`, line-height 1.6): Paragraph copy, descriptions, helper text. Max line length ≤75ch.
- **Label** (500, `text-xs` / `text-sm`): Button text, input placeholders, chip text, table cells. Letter-spacing 0.01em.
- **Eyebrow** (JetBrains Mono 500, 10–11px, letter-spacing 0.15em, uppercase): Section kickers only. The only place uppercase tracking is allowed; reserved for labels like "RESUME AI CHAT", "Built by Khiw", tooltips. Do not use for body or for headings.

### Named Rules

**The Mono is a Tool Rule.** Geist Mono is for code, prompts, timestamps, file names, version metadata, footer attribution. It is not the body font. The landing footer attribution is the canonical example: `text-[11px] font-mono` for "Built by Khiw · Forward-Deployed Full Stack Developer".

**The Eyebrow Budget Rule.** One eyebrow per page. A section can use an eyebrow as a deliberate brand system (Linear does this; we do it on the hero). Two or more eyebrows in close vertical proximity becomes the AI scaffold reflex and stops reading as voice.

**The Geist Pairing Rule.** Geist Sans carries all UI text. Geist Mono carries code, prompts, timestamps, file names, technical labels, and the footer attribution. The pair is neutral and technical; the personality comes from copy and layout, not from the type. Don't add a third sans to the system; the mono is the contrast pair, and that's enough.

**The Chat Bubble Rule.** A chat message renders in Geist Sans (not serif) on one of two tonal surfaces: assistant = `bg-secondary` (Cool Secondary), user = `bg-primary/10` (Bio Emerald at 10%, with a 1px `border-primary/20` for a soft accent edge). Both bubbles share the same radius (`rounded-2xl`), the same padding (`px-4 py-3`), and the same max width (`max-w-[90%]`). The bubbles never carry gradients, never carry `shadow-*`, never use `dark:bg-white/5` (glassmorphism). The user bubble is `self-end`, the assistant is `self-start`. The contrast between the two roles comes from surface tone and alignment, not from ornament.

**The Empty-State Heading Rule.** The Display h1 (`clamp(24px,4vw,38px)`) is reserved for hero surfaces. An empty state inside an interactive tool (a chat, a settings page, a search) uses the Headline role (`text-lg font-semibold`) plus a one-sentence persona line, never the hero h1. The hero h1 is a one-per-surface budget; diluting it across an app's empty states is the AI scaffold reflex.

## 4. Elevation

**Default: tonal layering.** Hierarchy is conveyed by stepping through the surface ramp (base → card → popover → secondary → accent). The five-step ramp keeps the chroma low and the lightness deltas small (≤5%) so the eye reads hierarchy as "different surface, same surface family" rather than as "card stacked on card".

**Shadows are reserved for state.** A `shadow-sm` on a button or a `shadow-md` on a focused input is allowed — it tells the user that the element is responding. A `shadow` on a static card is not. The system has no ambient or ambient-low shadow vocabulary; the shadcn defaults (`shadow-sm`, `shadow-md`) are the only shadows in use, and they appear on interactive elements only.

### Shadow Vocabulary
- **button-resting** (`box-shadow: 0 1px 2px rgba(0,0,0,0.2)`): Default button shadow. The default `default` button variant carries this; `secondary` and `ghost` do not.
- **chat-input-resting** (`box-shadow: 0 2px 8px rgba(0,0,0,0.25)`): The chat input carries a slightly larger shadow at rest. This is the one place a non-state shadow is allowed, because the chat input is the primary affordance of the product and benefits from being present at rest.

### Named Rules

**The Flat-by-Default Rule.** Surfaces are flat at rest. A card sits on the surface by being a different tone, not by being lifted by a shadow. Shadows appear only on (a) buttons, (b) focused inputs, (c) the chat input at rest (a single, deliberate exception).

**The No-Stacking Rule.** No card stacks on a card. A list of cards on a tonal surface is fine; a card-within-a-card is not. If a piece of content needs more emphasis than its parent, change the surface tone, not the depth.

## 5. Components

### Buttons (shadcn/ui new-york base)
- **Shape:** `rounded-md` (10px) on all variants. Heights: `h-8` (sm), `h-9` (default), `h-10` (lg), `h-9 w-9` (icon).
- **Primary (`default`):** Bio Emerald background, surface-base text, `shadow-sm` at rest. On hover: emerald at 90% opacity. This is the loudest element in the system.
- **Secondary:** Cool Secondary background, ink-strong text, `shadow-sm` at rest. The default for "second action on a surface".
- **Ghost:** Transparent background, ink-strong text. On hover: Cool Accent background. The default for nav links and tertiary actions.
- **Outline:** Transparent background, Cool Border stroke, ink-strong text. On hover: Cool Accent background. Used for the attachment button in the chat input.
- **Destructive:** Structural Red background, ink-strong text, `shadow-sm` at rest. Reserved for delete actions.
- **Link:** No background, Bio Emerald text, underline on hover. Used inline.
- **Icon-pill (custom):** `rounded-xl` (16px), 40×40, Bio Emerald background, surface-base icon. Used for the send and stop buttons in the chat input. The one place the radius and size diverge from the shadcn defaults.

### Chips (the hero starter chips)
- **Style:** `border border-border/60`, transparent background, `rounded-pill` (9999px), 8px/16px padding.
- **State:** At rest — cool border, ink-strong text. On hover: Cool Accent background, Bio Emerald border (40% opacity), surface-base text. The hover transition is 200ms with a 0.97 active scale.
- **Usage:** One of three sizes (xs/sm), labels ≤4 words. The chips navigate to `/chat?prompt=…`.

### Cards / Containers
- **Corner Style:** `rounded-md` (10px) for cards, `rounded-xl` (16px) for hero-adjacent surfaces (the chat input, the hero card).
- **Background:** Cool Card (`#0e1620`) for standard cards, Cool Secondary (`#161e2a`) for working surfaces (the chat sidebar, code blocks).
- **Shadow Strategy:** None on cards. Hierarchy is by surface tone.
- **Border:** 1px Cool Border. Optional `border-border/60` for a softer line.
- **Internal Padding:** 12–24px depending on density. The hero card uses 16–24px; the chat sidebar items use 8–12px.

### Inputs / Fields
- **Style:** `bg-background` (the base), `border border-border/60`, `rounded-2xl` (20px) on the chat input, `rounded-md` (10px) on form fields.
- **Focus:** Bio Emerald border at 40% opacity (`focus-within:border-primary/40`). A 200ms color transition. No glow, no scale, no shadow lift.
- **Error:** `bg-red-400/10` + `text-red-400` for the error banner inside the chat input. The error has a "Try again" button styled as `bg-red-400/20`.
- **Disabled:** 50% opacity, no pointer events.
- **Drag state (chat input only):** A 2px dashed Bio Emerald border overlays the input via a `::before` pseudo-element. The only place a dashed border is allowed.

### Navigation
- **Top bar (navbar.tsx):** `bg-background`, 16px vertical padding. Logo on the left, nav links and auth controls on the right. Nav links use the `ghost` button variant.
- **Sidebar (chat):** `bg-card`, 1px right border, 256px width when open, 0 when collapsed. The collapse is a 300ms `transition-all`. Active conversation: `bg-primary/10 text-primary`. Hover: `bg-accent text-foreground`.
- **Section markers (landing):** No numbered `01 / 02 / 03` markers. Widgets are separated by spacing and tonal shifts, not by ordinal labels.

### Hero Chat (signature component)
- **Layout:** Centered single column, `max-w-[720px]`, `min-h-screen`. Vertically centered on first paint.
- **Background:** A single radial-gradient halo at the top, `opacity-[0.015]` (3% in dark mode). No animation.
- **Eyebrow:** "Resume AI Chat" with a Sparkles icon, in the mono-eyebrow style. One per page.
- **Heading:** "Ask me anything" in the Display role.
- **Subhead:** A direct one-sentence persona statement, ink-muted, ≤75ch.
- **Starter chips:** Three to six chips, centered, `max-w-[520px]`.
- **Input:** The same chat input component used in `/chat`, stripped to a single text field plus the send button.
- **Footer attribution:** A mono line at the bottom, "No account required · Sessions save automatically · Full chat history". This is the canonical "small mono attribution" pattern.

### Tooltip / Dropdown
- **Tooltip:** Cool Popover background, ink-strong text, `rounded-md`, `delayDuration={0}` (no delay). Used on every icon button in the nav and chat input.
- **Dropdown menu:** Cool Popover background, `border border-border`, 224px width, 4px padding. Menu items: 32px height, 8px horizontal padding. Destructive items use `text-destructive`. The "About khiw.dev" item carries the logo.

### Resume Sandbox (chat's resume mode)
- **The Sandbox Rule:** the resume in `/chat` is a *per-conversation sandbox* of sections, not a single streamed object. Each recruiter prompt emits a **patch** (`add` / `update` / `remove` / `reorder`) that the client merges into the sandbox. The sandbox persists across turns in `localStorage` (key prefix `fragments-sandbox-`) keyed by conversation id; the right panel renders the merged view.
- Section ids are stable kebab-case slugs (e.g. `summary`, `experience-acme-2023`, `skills-frontend`). The model reuses ids for updates and invents new ones for adds. The chat's diff card surfaces the orchestration: `Added N · Updated M · Removed K · Reordered R` after each assistant message.
- The chat always shows the **sandbox view** (the merged state), not the streamed patch. The streamed patch is orchestration metadata; the sandbox is the artifact.
- "General resume" is the default focus; the model rewrites it on each turn to describe what the current view is tuned for, and that label drives the right-panel header.
- Backward compat: legacy `resumeContent` snapshots are seeded into a fresh sandbox on first session restore (see `app/chat/page.tsx: seedSandboxFromSnapshot`).

## 6. Do's and Don'ts

### Do
- **Do** use Bio Emerald for selection, primary action, current state, and the focused-input border only.
- **Do** use the surface ramp (base → card → popover → secondary → accent) to convey hierarchy before reaching for shadow or weight.
- **Do** pair Geist Sans with Geist Mono on code, prompts, timestamps, file names, and the footer attribution.
- **Do** keep button radius consistent at `rounded-md` (10px) — except the chat input's send button, which is `rounded-xl` (16px) to read as a primary affordance.
- **Do** cap body line length at 75ch and use `text-wrap: balance` on the hero h1.
- **Do** keep motion to state changes (150–250ms) and use `cubic-bezier(0.22, 1, 0.36, 1)` as the standard ease.
- **Do** provide a `prefers-reduced-motion` fallback for every animation.

### Don't
- **Don't** introduce a second accent color. The Bio Emerald carries selection; nothing else earns a saturated color.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored stripe on cards, list items, callouts, or alerts. Never intentional.
- **Don't** apply `background-clip: text` to a gradient. Decorative, never meaningful. Use a single solid color.
- **Don't** use glassmorphism as a default. Blurs and glass cards are decorative.
- **Don't** use `font-serif` on body or chat text. The Geist Pairing Rule: Geist Sans + Geist Mono only.
- **Don't** use `bg-gradient-to-b` (or any directional gradient) on chat message bubbles. The Bubble Rule: a single tonal surface per role, never a gradient.
- **Don't** use the Display h1 (`clamp(24px,4vw,38px)`) inside a chat empty state, a settings page, a search empty state, or any tool-like surface. The Display h1 is a one-per-page budget reserved for the hero.
- **Don't** put a 1px right border on a card, a panel, or a section. Never intentional.
- **Don't** ship `animate-bounce` on the scroll indicator (current state: `components/landing/scroll-indicator.tsx:10`). Replace with a subtle vertical translate using `cubic-bezier(0.22, 1, 0.36, 1)` and a `prefers-reduced-motion: reduce` fallback that drops the animation entirely.
- **Don't** put a tiny uppercase tracked eyebrow above every section. One per page is the budget (see The Eyebrow Budget Rule). Two or more reads as the AI scaffold reflex.
- **Don't** use `01 / 02 / 03` numbered markers as default scaffolding above sections. Numbered markers earn their place when the section is a real ordered sequence (a 3-step process, a typed timeline). The landing widgets are not.
- **Don't** default to Card for grouping. The portfolio widgets, the chat sidebar items, the starter chips, the dialog list items are all "a piece of content on a surface" — they sit on the surface by tone, not by card-within-card.
- **Don't** pair Geist Sans with another sans. The Geist Mono is the contrast pair; that's enough. If a second sans is added, it must pair on a real contrast axis.
- **Don't** use em dashes in copy. Use commas, colons, semicolons, periods, or parentheses.
- **Don't** ship a label like "Empower your AI journey" or "Unlock the future of coding." Specific nouns and verbs; the product is an open-source AI app builder, not a movement.
- **Don't** add a second dark mode shade. The system is single-theme dark. Light mode is technically wired (`next-themes`) but unused; leave it dormant.
- **Don't** wipe the resume on every prompt. The sandbox is the recruiter's working artifact; the agent patches it. Replacing the full resume on each turn is a regression to the pre-sandbox model. See the Resume Sandbox rule.

## Token Contract

Components may only use semantic Tailwind classes backed by tokens in `app/globals.css`:

- **Surfaces:** `bg-background`, `bg-card`, `bg-popover`, `bg-secondary`, `bg-accent`, `bg-input`, `bg-primary`, `bg-destructive`, `bg-surface-elevated`
- **Text:** `text-foreground`, `text-muted-foreground`, `text-primary`, and matching `*-foreground` pairs (`text-card-foreground`, `text-primary-foreground`, …)
- **Borders/focus:** `border-border`, `ring` (focus rings via `focus-visible:ring-2 focus-visible:ring-ring`)
- **Opacity modifiers allowed:** e.g. `bg-primary/10`, `border-primary/20`

**Forbidden:** raw hex values, `slate-*`, `indigo-*`, ad-hoc `rgba(...)` colors.

**Single exception:** the A4 resume sheet print region keeps its fixed print palette, marked with the comment `/* A4 PRINT PALETTE — fixed by design */`. Everything outside that comment scope follows this contract.
