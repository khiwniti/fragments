# Product

## Register

product

## Users

Two audiences, weighted equally.

1. **Portfolio visitors** — recruiters, hiring managers, prospective clients evaluating Ikkyu's work. They land on `/`, scan the projects / skills / career / open-source widgets, and may try the chat as a live capability demo. Time-to-impression is short; the site has to communicate competence in under a minute.

2. **Chat users** — developers who come to build fragments (Next.js apps, Python notebooks, Streamlit dashboards) and developers exploring the resume-RAG chat. They go straight to `/chat`, run long sessions, and judge the product on speed, clarity, and reliability while in flow.

The chat experience is the proof point for both audiences. A weak chat loses both.

## Product Purpose

**khiw.dev Fragments** is an open-source AI app builder in the Claude Artifacts / v0 / GPT Engineer family. It lets developers describe an app in natural language and receive a working, executable fragment (Next.js, Python, Streamlit, Gradio, Vue). The product also includes a resume-RAG chat that answers questions about Ikkyu's career using a graph-backed knowledge base.

Success means a developer can go from prompt to running app in under a minute, and a portfolio visitor leaves believing Ikkyu is a serious, opinionated engineer who ships production-grade interfaces. The chat is the demo, the portfolio is the résumé, and the source code is the receipt.

## Brand Personality

**Three words: sharp, technical, AI-native.**

The interface should feel like a code editor that grew a chat panel: dark by default, monospace first-class, terminal accents used surgically. Calm density over decorative spacing. The product is the work, and every surface, widget, and error state is an opportunity to demonstrate craft.

Voice: direct, specific, no marketing buzzwords. "Ask about my experience" beats "Unlock insights into my professional journey." "Build a Next.js app" beats "Empower your next big idea."

## Anti-references

The interface must not look like:

- **Cursor / Devin / bolt.new** — chat-bubble hero, fake-typing indicators, mascot characters, "magical" language, glowing borders. The product earns trust through substance, not spectacle.
- **Indie maker / Vercel-template** — gradient-text headline, three feature cards in a row, social-proof avatars, "Get started in 30 seconds" copy. Recognizable as a template by 2026.
- **Generic SaaS dark dashboard** — rounded-everything, gradient buttons, identical card grids, hero with three icons and a CTA. The look every Tailwind starter ships.

What to do instead: type and motion that earn their place, a single saturated accent (emerald), surfaces that get out of the way, copy that names what the product does.

## Design Principles

1. **The chat is the work.** Every other surface exists to support the chat experience or to prove the chat experience is real. Optimize the chat for long-session developer use: fast input, clear streaming, no decorative motion, predictable state. The portfolio's job is to route people to the chat and to earn the trust to keep them there.
2. **Code-editor native.** Dark surfaces, monospace first-class, terminal accents used surgically. The interface should feel like a tool a developer would actually leave open for hours, not a marketing site that happens to have a chat.
3. **One accent, used with intent.** The emerald primary carries selection, primary action, and current state. No second accent, no gradient text, no decorative glow outside the primary's job. Restrained is the default; Committed only on hero or result-state moments.
4. **Surface as state.** Use background, border, and type to communicate hierarchy and state — not cards, not shadows, not decoration. Portfolio widgets and the chat sidebar share a vocabulary; both feel like part of the same product.
5. **Restraint is the brand.** If a component is the same in two places, that's a virtue, not a missed opportunity. Density and consistency beat delight per pixel. Motion is state, not decoration.

## Accessibility & Inclusion

- **WCAG 2.2 AA** as the baseline. Body text ≥4.5:1, large text ≥3:1, full keyboard support, visible focus states on every interactive element, no information conveyed by color alone.
- **Reduced motion** for every animation. The product is long-session; motion must scale down cleanly. Streaming and loading states need motion-free fallbacks.
- **Internationalization** built in. User-facing copy is centralized (no hardcoded strings inside components). Date, number, and locale formatting routed through `Intl`. The product is currently English-only but should not require rewrites to expand.
