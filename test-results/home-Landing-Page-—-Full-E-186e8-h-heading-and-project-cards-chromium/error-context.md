# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home.spec.ts >> Landing Page — Full E2E >> Projects Section >> renders section with heading and project cards
- Location: e2e/home.spec.ts:92:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Rainmaking')
Expected: visible
Error: strict mode violation: getByText('Rainmaking') resolved to 5 elements:
    1) <div class="text-[13px] font-bold text-foreground">Rainmaking</div> aka getByRole('button', { name: 'View details for Rainmaking' })
    2) <div class="text-[11px] text-muted-foreground leading-[1.5] mb-1.5">Royal Rainmaking mission planning with PINNs</div> aka getByRole('button', { name: 'View details for Rainmaking' })
    3) <span class="truncate">rainmaking-mission-planing-dashboard.vercel.app</span> aka getByRole('button', { name: 'View details for Rainmaking' })
    4) <div class="text-[10px] text-muted-foreground leading-[1.6] font-mono mb-2">DDPM, TPQI, NSDF, NDWC, Rainmaking, AOT</div> aka getByText('DDPM, TPQI, NSDF, NDWC,')
    5) <p class="text-[13px] text-muted-foreground leading-[1.7] mt-3">AI/ML consulting, government digital transformati…</p> aka getByRole('button', { name: 'Associate Solution Architect' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Rainmaking')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - navigation [ref=e4]:
      - link "khiw.dev" [ref=e6] [cursor=pointer]:
        - /url: /
        - img [ref=e7]
        - heading "khiw.dev" [level=1] [ref=e9]
      - generic [ref=e10]:
        - link "Blog" [ref=e11] [cursor=pointer]:
          - /url: /blog
          - button "Blog" [ref=e12]:
            - img [ref=e13]
            - text: Blog
        - link "Chat" [ref=e16] [cursor=pointer]:
          - /url: /chat
          - button "Chat" [ref=e17]:
            - img [ref=e18]
            - text: Chat
        - link "Admin" [ref=e20] [cursor=pointer]:
          - /url: /admin
          - button "Admin" [ref=e21]:
            - img [ref=e22]
            - text: Admin
        - link "KG" [ref=e24] [cursor=pointer]:
          - /url: /kg
          - button "KG" [ref=e25]:
            - img [ref=e26]
            - text: KG
        - button [disabled]:
          - img
        - button [disabled]:
          - img
        - button "Sign in" [ref=e32] [cursor=pointer]:
          - text: Sign in
          - img [ref=e33]
    - generic [ref=e35]:
      - generic [ref=e37]:
        - generic [ref=e39]:
          - generic [ref=e40]:
            - heading "Ask me anything" [level=1] [ref=e41]
            - paragraph [ref=e42]: Hi, I'm Ikkyu — an AI-Augmented Full-Stack Developer. Ask about my experience, projects, or skills.
          - generic [ref=e43]:
            - button "Cloud architecture experience" [ref=e44] [cursor=pointer]
            - button "Production AI projects" [ref=e45] [cursor=pointer]
            - button "Leadership & team scope" [ref=e46] [cursor=pointer]
            - button "TypeScript / Next.js depth" [ref=e47] [cursor=pointer]
            - button "Recent 2024–2025 work" [ref=e48] [cursor=pointer]
            - button "Knowledge graph approach" [ref=e49] [cursor=pointer]
            - button "Career pivot story" [ref=e50] [cursor=pointer]
        - generic [ref=e52]:
          - generic [ref=e53]:
            - textbox "Ask about experience, skills, or projects..." [ref=e54]
            - button [disabled] [ref=e55]:
              - img [ref=e56]
          - paragraph [ref=e58]: Ask about Khiw (Ikkyu) Nitithadachot — AI-Augmented Full-Stack Developer
      - generic:
        - generic: Scroll
        - img
    - generic [ref=e59]:
      - generic [ref=e63]: Projects
      - heading "Selected Work" [level=2] [ref=e65]
      - paragraph [ref=e67]: From 50+ Vercel deployments and 47 Cloudflare Workers
      - generic [ref=e68]:
        - button "View details for CarbonBIM" [ref=e70] [cursor=pointer]:
          - generic [ref=e71]:
            - generic [ref=e72]: CarbonBIM
            - generic [ref=e73]: BIM+AI
          - generic [ref=e74]: AI carbon calculator — IFC upload, 104+ TGO emission factors
          - generic [ref=e75]:
            - generic [ref=e76]: bim.getintheq.space
            - generic [ref=e77]: ↗
        - button "View details for EarthCast AI" [ref=e79] [cursor=pointer]:
          - generic [ref=e80]:
            - generic [ref=e81]: EarthCast AI
            - generic [ref=e82]: Earth
          - generic [ref=e83]: AI weather forecast — PINNs + FourCastNet + CesiumJS
          - generic [ref=e84]:
            - generic [ref=e85]: earthcast-ai.vercel.app
            - generic [ref=e86]: ↗
        - button "View details for Facility Manager" [ref=e88] [cursor=pointer]:
          - generic [ref=e89]:
            - generic [ref=e90]: Facility Manager
            - generic [ref=e91]: 3D
          - generic [ref=e92]: Full-stack building management with 3D viewer
          - generic [ref=e93]:
            - generic [ref=e94]: facility-management-app-mocha.vercel.app
            - generic [ref=e95]: ↗
        - button "View details for NDWC Smart Alert" [ref=e97] [cursor=pointer]:
          - generic [ref=e98]:
            - generic [ref=e99]: NDWC Smart Alert
            - generic [ref=e100]: Gov
          - generic [ref=e101]: Thailand flood monitoring & AI water alerts
          - generic [ref=e102]:
            - generic [ref=e103]: ndwc-smart-alert.vercel.app
            - generic [ref=e104]: ↗
        - button "View details for GDAS Disaster" [ref=e106] [cursor=pointer]:
          - generic [ref=e107]:
            - generic [ref=e108]: GDAS Disaster
            - generic [ref=e109]: Gov
          - generic [ref=e110]: DDPM multi-hazard early warning (14 types, CAP v1.2)
          - generic [ref=e111]:
            - generic [ref=e112]: gdas-ai-disaster-watch.vercel.app
            - generic [ref=e113]: ↗
        - button "View details for NT Facility 3D" [ref=e115] [cursor=pointer]:
          - generic [ref=e116]:
            - generic [ref=e117]: NT Facility 3D
            - generic [ref=e118]: Telecom
          - generic [ref=e119]: National Telecom 3D facility (xeokit/Three.js)
          - generic [ref=e120]:
            - generic [ref=e121]: nt-facility-3-d-manager-new-ui.vercel.app
            - generic [ref=e122]: ↗
        - button "View details for Rainmaking" [ref=e124] [cursor=pointer]:
          - generic [ref=e125]:
            - generic [ref=e126]: Rainmaking
            - generic [ref=e127]: Gov+AI
          - generic [ref=e128]: Royal Rainmaking mission planning with PINNs
          - generic [ref=e129]:
            - generic [ref=e130]: rainmaking-mission-planing-dashboard.vercel.app
            - generic [ref=e131]: ↗
        - button "View details for BIM Companion" [ref=e133] [cursor=pointer]:
          - generic [ref=e134]:
            - generic [ref=e135]: BIM Companion
            - generic [ref=e136]: BIM
          - generic [ref=e137]: Browser-native IFC viewer with AI companion
          - generic [ref=e138]:
            - generic [ref=e139]: bim-model-companion.vercel.app
            - generic [ref=e140]: ↗
        - button "View details for SCADA AI" [ref=e142] [cursor=pointer]:
          - generic [ref=e143]:
            - generic [ref=e144]: SCADA AI
            - generic [ref=e145]: IoT
          - generic [ref=e146]: Industrial IoT AI monitoring platform
          - generic [ref=e147]:
            - generic [ref=e148]: scada-ai.vercel.app
            - generic [ref=e149]: ↗
        - button "View details for Farmbook" [ref=e151] [cursor=pointer]:
          - generic [ref=e152]:
            - generic [ref=e153]: Farmbook
            - generic [ref=e154]: Gov
          - generic [ref=e155]: Ministry of Agriculture data dashboard
          - generic [ref=e156]:
            - generic [ref=e157]: farmbook-dashboard.vercel.app
            - generic [ref=e158]: ↗
        - button "View details for BiteBase API" [ref=e160] [cursor=pointer]:
          - generic [ref=e161]:
            - generic [ref=e162]: BiteBase API
            - generic [ref=e163]: F&B
          - generic [ref=e164]: Restaurant BI backend with AI agents
          - generic [ref=e165]:
            - generic [ref=e166]: api.bitebase.app
            - generic [ref=e167]: ↗
        - button "View details for Pipeline Viz" [ref=e169] [cursor=pointer]:
          - generic [ref=e170]:
            - generic [ref=e171]: Pipeline Viz
            - generic [ref=e172]: Data
          - generic [ref=e173]: ETL pipeline visualization tool
          - generic [ref=e174]:
            - generic [ref=e175]: data-pipeline-visualizer.vercel.app
            - generic [ref=e176]: ↗
      - button "Ask AI about this section" [ref=e179] [cursor=pointer]:
        - img [ref=e180]
        - text: Ask AI about this section
        - img [ref=e182]
    - generic [ref=e184]:
      - generic [ref=e188]: Expertise
      - heading "Industry Domains" [level=2] [ref=e190]
      - paragraph [ref=e192]: Each domain maps to real projects. Hover a tech badge to see matching content highlight across all sections.
      - generic [ref=e193]:
        - generic [ref=e195]:
          - generic [ref=e196]:
            - generic [ref=e197]: ◆
            - generic [ref=e198]: BIM & Construction
          - generic [ref=e199]: IFC, EN 15978, TGO, EDGE, TREES, BOQ-to-cost
          - generic [ref=e201]: ifc
        - generic [ref=e203]:
          - generic [ref=e204]:
            - generic [ref=e205]: ◇
            - generic [ref=e206]: Weather & Earth Science
          - generic [ref=e207]: FourCastNet, PINNs, GFS, CesiumJS, NOAA
          - generic [ref=e208]:
            - generic [ref=e209]: pinns
            - generic [ref=e210]: cesiumjs
            - generic [ref=e211]: noaa
        - generic [ref=e213]:
          - generic [ref=e214]:
            - generic [ref=e215]: ▣
            - generic [ref=e216]: Thai Government
          - generic [ref=e217]: DDPM, TPQI, NSDF, NDWC, Rainmaking, AOT
        - generic [ref=e219]:
          - generic [ref=e220]:
            - generic [ref=e221]: △
            - generic [ref=e222]: Hospitality & F&B
          - generic [ref=e223]: BiteBase, HotelCSI, Wongnai, LINE MAN
        - generic [ref=e225]:
          - generic [ref=e226]:
            - generic [ref=e227]: ○
            - generic [ref=e228]: Engineering Simulation
          - generic [ref=e229]: ANSYS, COMSOL, OpenFOAM, DeepXDE, Moldex3D
          - generic [ref=e230]:
            - generic [ref=e231]: ansys
            - generic [ref=e232]: comsol
            - generic [ref=e233]: openfoam
            - generic [ref=e234]: deepxde
            - generic [ref=e235]: moldex3d
        - generic [ref=e237]:
          - generic [ref=e238]:
            - generic [ref=e239]: □
            - generic [ref=e240]: Healthcare
          - generic [ref=e241]: FHIR R4, Thai NLP, LINE OA, lab analysis
          - generic [ref=e242]:
            - generic [ref=e243]: fhir
            - generic [ref=e244]: nlp
    - generic [ref=e245]:
      - generic [ref=e249]: Skills
      - heading "Tech Stack" [level=2] [ref=e251]
      - paragraph [ref=e253]: Core technologies and frameworks used across projects.
      - generic [ref=e255]:
        - button "AI / Agents" [ref=e256] [cursor=pointer]
        - button "Full-Stack" [ref=e257] [cursor=pointer]
        - button "Data / Cloud" [ref=e258] [cursor=pointer]
        - button "Engineering" [ref=e259] [cursor=pointer]
        - button "Platforms" [ref=e260] [cursor=pointer]
      - generic [ref=e262]:
        - generic [ref=e263]: LangGraph
        - generic [ref=e264]: Claude Sonnet
        - generic [ref=e265]: Qwen3
        - generic [ref=e266]: MCP
        - generic [ref=e267]: A2A
        - generic [ref=e268]: Huggingface
        - generic [ref=e269]: Typhoon
        - generic [ref=e270]: PINNs
        - generic [ref=e271]: DeepXDE
    - generic [ref=e272]:
      - generic [ref=e276]: Experience
      - heading "Career Timeline" [level=2] [ref=e278]
      - generic [ref=e279]:
        - button "Associate Solution Architect at Bangkok Silicon (BKS)" [expanded] [ref=e281] [cursor=pointer]:
          - generic [ref=e283]:
            - generic [ref=e284]:
              - generic [ref=e285]: 2025–Now
              - generic [ref=e286]:
                - generic [ref=e287]: Associate Solution Architect
                - generic [ref=e288]: Bangkok Silicon (BKS)
            - img [ref=e290]
          - generic [ref=e292]:
            - paragraph [ref=e293]: AI/ML consulting, government digital transformation, BIM agentic frameworks, DDPM disaster platforms, Royal Rainmaking AI, hospitality intelligence.
            - generic [ref=e294]:
              - generic [ref=e295]: ai
              - generic [ref=e296]: ml
        - button "Lead Data & AI Engineer at Libralytics (Freelance)" [ref=e298] [cursor=pointer]:
          - generic [ref=e300]:
            - generic [ref=e301]:
              - generic [ref=e302]: 2024–Now
              - generic [ref=e303]:
                - generic [ref=e304]: Lead Data & AI Engineer
                - generic [ref=e305]: Libralytics (Freelance)
            - img [ref=e307]
        - button "CFD/FEA Specialist at Freelance (7+ years)" [ref=e310] [cursor=pointer]:
          - generic [ref=e312]:
            - generic [ref=e313]:
              - generic [ref=e314]: 2019–Now
              - generic [ref=e315]:
                - generic [ref=e316]: CFD/FEA Specialist
                - generic [ref=e317]: Freelance (7+ years)
            - img [ref=e319]
        - button "Data Engineer at Tipco Asphalt" [ref=e322] [cursor=pointer]:
          - generic [ref=e324]:
            - generic [ref=e325]:
              - generic [ref=e326]: "2025"
              - generic [ref=e327]:
                - generic [ref=e328]: Data Engineer
                - generic [ref=e329]: Tipco Asphalt
            - img [ref=e331]
        - button "Service Dev Specialist at Q-CHANG" [ref=e334] [cursor=pointer]:
          - generic [ref=e336]:
            - generic [ref=e337]:
              - generic [ref=e338]: "2023"
              - generic [ref=e339]:
                - generic [ref=e340]: Service Dev Specialist
                - generic [ref=e341]: Q-CHANG
            - img [ref=e343]
        - button "Future Leader (FLP 12) at Charoen Pokphand Group" [ref=e346] [cursor=pointer]:
          - generic [ref=e348]:
            - generic [ref=e349]:
              - generic [ref=e350]: 2022–23
              - generic [ref=e351]:
                - generic [ref=e352]: Future Leader (FLP 12)
                - generic [ref=e353]: Charoen Pokphand Group
            - img [ref=e355]
        - button "Nuclear Engineer at Thailand Institute of Nuclear Technology" [ref=e358] [cursor=pointer]:
          - generic [ref=e360]:
            - generic [ref=e361]:
              - generic [ref=e362]: 2021–22
              - generic [ref=e363]:
                - generic [ref=e364]: Nuclear Engineer
                - generic [ref=e365]: Thailand Institute of Nuclear Technology
            - img [ref=e367]
        - button "Mechanical Design Engineer at Arçelik Hitachi" [ref=e370] [cursor=pointer]:
          - generic [ref=e372]:
            - generic [ref=e373]:
              - generic [ref=e374]: "2021"
              - generic [ref=e375]:
                - generic [ref=e376]: Mechanical Design Engineer
                - generic [ref=e377]: Arçelik Hitachi
            - img [ref=e379]
        - button "Mechanical Engineer at MACS" [ref=e382] [cursor=pointer]:
          - generic [ref=e384]:
            - generic [ref=e385]:
              - generic [ref=e386]: 2019–21
              - generic [ref=e387]:
                - generic [ref=e388]: Mechanical Engineer
                - generic [ref=e389]: MACS
            - img [ref=e391]
      - generic [ref=e394]:
        - generic [ref=e395]: Education
        - generic [ref=e396]: B.Eng Mechanical Engineering — Naresuan University (2015–2019)
        - generic [ref=e397]: GPA 3.50, First Class Honors · EF SET C2 (72/100) · Thai (Native)
      - button "Ask AI about this section" [ref=e400] [cursor=pointer]:
        - img [ref=e401]
        - text: Ask AI about this section
        - img [ref=e403]
    - generic [ref=e405]:
      - generic [ref=e409]: Open Source
      - heading "Passion Projects" [level=2] [ref=e411]
      - paragraph [ref=e413]: Open-source work and side projects that solve real problems.
      - generic [ref=e414]:
        - button "kidpen.org — Free STEM Education for Thailand" [expanded] [ref=e416] [cursor=pointer]:
          - generic [ref=e417]:
            - generic [ref=e419]:
              - generic [ref=e420]: kidpen.org
              - generic [ref=e421]: Free STEM Education for Thailand
            - img [ref=e423]
          - paragraph [ref=e425]: Open-source STEM platform for Thai students (ม.1+), inspired by Brilliant.org. Next.js, FastAPI, Qwen3. AI tutor mascot Ping.
          - link "kidpen.org" [ref=e427]:
            - /url: https://kidpen.org
            - img [ref=e428]
            - text: kidpen.org
        - button "CarbonScope — Embodied Carbon Intelligence" [ref=e431] [cursor=pointer]:
          - generic [ref=e432]:
            - generic [ref=e434]:
              - generic [ref=e435]: CarbonScope
              - generic [ref=e436]: Embodied Carbon Intelligence
            - img [ref=e438]
          - paragraph [ref=e440]: Thai construction sustainability platform. EN 15978 lifecycle carbon, TGO emission factors, EDGE/TREES certification.
        - button "FloodSight — Province-Level Flood Risk Scoring" [ref=e442] [cursor=pointer]:
          - generic [ref=e443]:
            - generic [ref=e445]:
              - generic [ref=e446]: FloodSight
              - generic [ref=e447]: Province-Level Flood Risk Scoring
            - img [ref=e449]
          - paragraph [ref=e451]: ZerveHack 2026 (Climate & Energy). NOAA GHCN-Daily + NVIDIA FourCastNet. Thai Flood Risk Score for 77 provinces.
    - generic [ref=e452]:
      - generic [ref=e456]: Contact
      - heading "Get in Touch" [level=2] [ref=e458]
      - paragraph [ref=e460]: Have a project in mind, a collaboration idea, or just want to say hi? I'll get back to you within 24 hours.
      - generic [ref=e462]:
        - link "G GitHub" [ref=e463] [cursor=pointer]:
          - /url: https://github.com/getintheQ
          - generic [ref=e464]: G
          - generic [ref=e465]: GitHub
        - link "in LinkedIn" [ref=e466] [cursor=pointer]:
          - /url: https://linkedin.com/in/getintheq
          - generic [ref=e467]: in
          - generic [ref=e468]: LinkedIn
        - link "@ Email" [ref=e469] [cursor=pointer]:
          - /url: mailto:kiw.brw@gmail.com
          - generic [ref=e470]: "@"
          - generic [ref=e471]: Email
        - link "↗ Resume" [ref=e472] [cursor=pointer]:
          - /url: /api/resume
          - generic [ref=e473]: ↗
          - generic [ref=e474]: Resume
      - generic [ref=e476]:
        - paragraph [ref=e477]: "Or send a message directly via the chat below:"
        - link "Start a Chat" [ref=e478] [cursor=pointer]:
          - /url: /chat
          - img [ref=e479]
          - text: Start a Chat
    - generic [ref=e481]:
      - paragraph [ref=e482]: Built by Khiw (Ikkyu) Nitithadachot · AI-Augmented Full-Stack Developer
      - paragraph [ref=e483]: Next.js · Tailwind · TypeScript · Supabase · Cloudflare
  - region "Notifications (F8)":
    - list
  - button "Open Next.js Dev Tools" [ref=e489] [cursor=pointer]:
    - img [ref=e490]
  - alert [ref=e493]
```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test'
  2   | import { starterChips } from '@/lib/profile'
  3   | import { STATIC_PROJECTS, DOMAINS, SKILL_GROUPS, CAREER, SIDE_PROJECTS, SOCIAL_LINKS } from '@/components/landing/data'
  4   | 
  5   | // ── Helpers ──────────────────────────────────────────────────────────────
  6   | 
  7   | let consoleErrors: { message: string; source: string }[] = []
  8   | 
  9   | async function setupPage(page: Page) {
  10  |   consoleErrors = []
  11  |   page.on('console', (msg) => {
  12  |     if (msg.type() === 'error') {
  13  |       consoleErrors.push({ message: msg.text(), source: msg.location().url })
  14  |     }
  15  |   })
  16  |   page.on('pageerror', (err) => {
  17  |     consoleErrors.push({ message: err.message, source: '' })
  18  |   })
  19  |   await page.goto('/')
  20  |   // Wait for the page to be fully loaded — the hero section should be visible
  21  |   await page.waitForLoadState('networkidle')
  22  | }
  23  | 
  24  | async function scrollToSection(page: Page, sectionTestId: string) {
  25  |   const el = page.locator(`text=${sectionTestId}`)
  26  |   await el.scrollIntoViewIfNeeded()
  27  |   await page.waitForTimeout(800) // wait for reveal animation
  28  | }
  29  | 
  30  | // ── Tests ────────────────────────────────────────────────────────────────
  31  | 
  32  | test.describe('Landing Page — Full E2E', () => {
  33  | 
  34  |   // ── NavBar ───────────────────────────────────────────────────────────
  35  |   test.describe('NavBar', () => {
  36  |     test('renders logo and site title', async ({ page }) => {
  37  |       await setupPage(page)
  38  |       await expect(page.locator('nav')).toBeVisible()
  39  |       await expect(page.getByText('khiw.dev')).toBeVisible()
  40  |     })
  41  | 
  42  |     test('shows navigation links: Blog, Chat, Admin, KG', async ({ page }) => {
  43  |       await setupPage(page)
  44  |       const nav = page.locator('nav')
  45  |       // Blog and Chat should always be visible (hidden sm:flex becomes flex on wide viewport)
  46  |       // We check they exist in DOM
  47  |       await expect(nav.getByText('Blog')).toBeVisible()
  48  |       await expect(nav.getByText('Chat')).toBeVisible()
  49  |     })
  50  | 
  51  |     test('shows Sign in button when not authenticated', async ({ page }) => {
  52  |       await setupPage(page)
  53  |       await expect(page.getByText('Sign in')).toBeVisible()
  54  |     })
  55  |   })
  56  | 
  57  |   // ── HeroChat ──────────────────────────────────────────────────────────
  58  |   test.describe('HeroChat Section', () => {
  59  |     test('displays the main heading and greeting', async ({ page }) => {
  60  |       await setupPage(page)
  61  |       await expect(page.getByText('Ask me anything')).toBeVisible()
  62  |       await expect(page.getByText(/Hi, I'm Ikkyu/)).toBeVisible()
  63  |     })
  64  | 
  65  |     test('renders all starter chips', async ({ page }) => {
  66  |       await setupPage(page)
  67  |       for (const chip of starterChips) {
  68  |         await expect(page.getByText(chip.label)).toBeVisible()
  69  |       }
  70  |     })
  71  | 
  72  |     test('shows chat input textarea with placeholder', async ({ page }) => {
  73  |       await setupPage(page)
  74  |       const textarea = page.locator('textarea')
  75  |       await expect(textarea).toBeVisible()
  76  |       await expect(textarea).toHaveAttribute('placeholder', /Ask about/)
  77  |     })
  78  | 
  79  |     test('clicking a starter chip hides chips and shows user message', async ({ page }) => {
  80  |       await setupPage(page)
  81  |       const chip = starterChips[0]
  82  |       await page.getByText(chip.label).click()
  83  |       // Wait for the AI response to start streaming
  84  |       await page.waitForTimeout(3000)
  85  |       // The user's question should appear as a chat bubble
  86  |       await expect(page.getByText(chip.prompt)).toBeVisible()
  87  |     })
  88  |   })
  89  | 
  90  |   // ── Projects ──────────────────────────────────────────────────────────
  91  |   test.describe('Projects Section', () => {
  92  |     test('renders section with heading and project cards', async ({ page }) => {
  93  |       await setupPage(page)
  94  |       await scrollToSection(page, 'Selected Work')
  95  |       await expect(page.getByText('Selected Work')).toBeVisible()
  96  |       await expect(page.getByText('From 50+ Vercel deployments')).toBeVisible()
  97  |       for (const project of STATIC_PROJECTS) {
> 98  |         await expect(page.getByText(project.name)).toBeVisible()
      |                                                    ^ Error: expect(locator).toBeVisible() failed
  99  |       }
  100 |     })
  101 | 
  102 |     test('opens detail panel when clicking a project card', async ({ page }) => {
  103 |       await setupPage(page)
  104 |       await scrollToSection(page, 'Selected Work')
  105 |       const firstProject = STATIC_PROJECTS[0]
  106 |       await page.getByText(firstProject.name).click()
  107 |       // Detail dialog should appear
  108 |       await expect(page.getByRole('dialog')).toBeVisible()
  109 |       await expect(page.getByRole('dialog')).toContainText(firstProject.description)
  110 |       // Close the dialog
  111 |       await page.getByLabel('Close').click()
  112 |       await expect(page.getByRole('dialog')).not.toBeVisible()
  113 |     })
  114 |   })
  115 | 
  116 |   // ── Domains ───────────────────────────────────────────────────────────
  117 |   test.describe('Domains Section', () => {
  118 |     test('renders section with industry domain cards', async ({ page }) => {
  119 |       await setupPage(page)
  120 |       await scrollToSection(page, 'Industry Domains')
  121 |       await expect(page.getByText('Industry Domains')).toBeVisible()
  122 |       for (const domain of DOMAINS) {
  123 |         await expect(page.getByText(domain.label)).toBeVisible()
  124 |       }
  125 |     })
  126 |   })
  127 | 
  128 |   // ── Skills ────────────────────────────────────────────────────────────
  129 |   test.describe('Skills Section', () => {
  130 |     test('renders Tech Stack heading with category tabs', async ({ page }) => {
  131 |       await setupPage(page)
  132 |       await scrollToSection(page, 'Tech Stack')
  133 |       await expect(page.getByText('Tech Stack')).toBeVisible()
  134 |       for (const group of SKILL_GROUPS) {
  135 |         await expect(page.getByText(group.category)).toBeVisible()
  136 |       }
  137 |     })
  138 | 
  139 |     test('switching category tab shows different skills', async ({ page }) => {
  140 |       await setupPage(page)
  141 |       await scrollToSection(page, 'Tech Stack')
  142 |       // Click the second category tab
  143 |       const secondCat = SKILL_GROUPS[1]
  144 |       await page.getByText(secondCat.category).click()
  145 |       // Wait for transition
  146 |       await page.waitForTimeout(300)
  147 |       // Some skills from this category should be visible
  148 |       for (const skill of secondCat.skills.slice(0, 2)) {
  149 |         await expect(page.getByText(skill)).toBeVisible()
  150 |       }
  151 |     })
  152 |   })
  153 | 
  154 |   // ── Career ────────────────────────────────────────────────────────────
  155 |   test.describe('Career Section', () => {
  156 |     test('renders Career Timeline with entries', async ({ page }) => {
  157 |       await setupPage(page)
  158 |       await scrollToSection(page, 'Career Timeline')
  159 |       await expect(page.getByText('Career Timeline')).toBeVisible()
  160 |       // First career entry (most recent) should be expanded by default
  161 |       const latest = CAREER[0]
  162 |       await expect(page.getByText(latest.title)).toBeVisible()
  163 |       await expect(page.getByText(latest.company)).toBeVisible()
  164 |     })
  165 | 
  166 |     test('expanding a career entry shows description', async ({ page }) => {
  167 |       await setupPage(page)
  168 |       await scrollToSection(page, 'Career Timeline')
  169 |       // The first entry should be expanded by default (expandedIndex === 0)
  170 |       const firstEntry = CAREER[0]
  171 |       await expect(page.getByText(firstEntry.description)).toBeVisible()
  172 |     })
  173 | 
  174 |     test('shows Education section', async ({ page }) => {
  175 |       await setupPage(page)
  176 |       await scrollToSection(page, 'Career Timeline')
  177 |       await expect(page.getByText('Education')).toBeVisible()
  178 |       await expect(page.getByText(/B\.Eng Mechanical Engineering/)).toBeVisible()
  179 |     })
  180 |   })
  181 | 
  182 |   // ── Open Source ───────────────────────────────────────────────────────
  183 |   test.describe('Open Source Section', () => {
  184 |     test('renders Passion Projects with entries', async ({ page }) => {
  185 |       await setupPage(page)
  186 |       await scrollToSection(page, 'Passion Projects')
  187 |       await expect(page.getByText('Passion Projects')).toBeVisible()
  188 |       const first = SIDE_PROJECTS[0]
  189 |       await expect(page.getByText(first.name)).toBeVisible()
  190 |     })
  191 |   })
  192 | 
  193 |   // ── Contact ───────────────────────────────────────────────────────────
  194 |   test.describe('Contact Section', () => {
  195 |     test('renders Get in Touch with social links', async ({ page }) => {
  196 |       await setupPage(page)
  197 |       await scrollToSection(page, 'Get in Touch')
  198 |       await expect(page.getByText('Get in Touch')).toBeVisible()
```