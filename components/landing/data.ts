// Static portfolio data — single source of truth for landing page sections.
// When DB-backed portfolio APIs are fully seeded, these can be fetched dynamically.

export type CareerEntry = {
  year: string;
  title: string;
  company: string;
  description: string;
  highlight?: boolean;
};

export const CAREER: CareerEntry[] = [
  { year: '2025–Now', title: 'Associate Solution Architect', company: 'Bangkok Silicon (BKS)', description: 'AI/ML consulting, government digital transformation, BIM agentic frameworks, DDPM disaster platforms, Royal Rainmaking AI, hospitality intelligence.', highlight: true },
  { year: '2024–Now', title: 'Lead Data & AI Engineer', company: 'Libralytics (Freelance)', description: 'AI agents for restaurant marketing, MLOps (Docker/K8s), full-stack pipelines, FastAPI, Apache Airflow, Next.js.' },
  { year: '2019–Now', title: 'CFD/FEA Specialist', company: 'Freelance (7+ years)', description: 'ANSYS Fluent/CFX, COMSOL, OpenFOAM, Moldex3D. Aerodynamics, turbomachinery, HVAC, multiphase flows, heat transfer.' },
  { year: '2025', title: 'Data Engineer', company: 'Tipco Asphalt', description: 'Azure Data Factory, Synapse Analytics, Oracle-to-cloud migration, LLM integration.' },
  { year: '2023', title: 'Service Dev Specialist', company: 'Q-CHANG', description: 'SOPs, GMV forecasting (regression), Python sentiment analysis, supplier management.' },
  { year: '2022–23', title: 'Future Leader (FLP 12)', company: 'Charoen Pokphand Group', description: "24-cavity mold → 300K pcs/day. +2.9M Baht sales. Power BI. Reported to CP Shareman Executive." },
  { year: '2021–22', title: 'Nuclear Engineer', company: 'Thailand Institute of Nuclear Technology', description: 'Radiopharmaceutical production (I-131). ISO 9001, GMP. Data science for preventive maintenance.' },
  { year: '2021', title: 'Mechanical Design Engineer', company: 'Arçelik Hitachi', description: 'ANSYS & Moldex3D stress/fatigue analysis. Prototype testing with Japanese lab. FBF640→720.' },
  { year: '2019–21', title: 'Mechanical Engineer', company: 'MACS', description: 'EPC at Bangchack Refinery. QC Welding (ASME IX). AutoCAD Plant 3D.' },
];

export type StaticProject = { name: string; url: string; tag: string; description: string };
export const STATIC_PROJECTS: StaticProject[] = [
  { name: 'CarbonBIM', url: 'https://bim.getintheq.space', tag: 'BIM+AI', description: 'AI carbon calculator — IFC upload, 104+ TGO emission factors' },
  { name: 'EarthCast AI', url: 'https://earthcast-ai.vercel.app', tag: 'Earth', description: 'AI weather forecast — PINNs + FourCastNet + CesiumJS' },
  { name: 'Facility Manager', url: 'https://facility-management-app-mocha.vercel.app', tag: '3D', description: 'Full-stack building management with 3D viewer' },
  { name: 'NDWC Smart Alert', url: 'https://ndwc-smart-alert.vercel.app', tag: 'Gov', description: 'Thailand flood monitoring & AI water alerts' },
  { name: 'GDAS Disaster', url: 'https://gdas-ai-disaster-watch.vercel.app', tag: 'Gov', description: 'DDPM multi-hazard early warning (14 types, CAP v1.2)' },
  { name: 'NT Facility 3D', url: 'https://nt-facility-3-d-manager-new-ui.vercel.app', tag: 'Telecom', description: 'National Telecom 3D facility (xeokit/Three.js)' },
  { name: 'Rainmaking', url: 'https://rainmaking-mission-planing-dashboard.vercel.app', tag: 'Gov+AI', description: 'Royal Rainmaking mission planning with PINNs' },
  { name: 'BIM Companion', url: 'https://bim-model-companion.vercel.app', tag: 'BIM', description: 'Browser-native IFC viewer with AI companion' },
  { name: 'SCADA AI', url: 'https://scada-ai.vercel.app', tag: 'IoT', description: 'Industrial IoT AI monitoring platform' },
  { name: 'Farmbook', url: 'https://farmbook-dashboard.vercel.app', tag: 'Gov', description: 'Ministry of Agriculture data dashboard' },
  { name: 'BiteBase API', url: 'https://api.bitebase.app', tag: 'F&B', description: 'Restaurant BI backend with AI agents' },
  { name: 'Pipeline Viz', url: 'https://data-pipeline-visualizer.vercel.app', tag: 'Data', description: 'ETL pipeline visualization tool' },
];

export type Domain = { icon: string; label: string; description: string };
export const DOMAINS: Domain[] = [
  { icon: '◆', label: 'BIM & Construction', description: 'IFC, EN 15978, TGO, EDGE, TREES, BOQ-to-cost' },
  { icon: '◇', label: 'Weather & Earth Science', description: 'FourCastNet, PINNs, GFS, CesiumJS, NOAA' },
  { icon: '▣', label: 'Thai Government', description: 'DDPM, TPQI, NSDF, NDWC, Rainmaking, AOT' },
  { icon: '△', label: 'Hospitality & F&B', description: 'BiteBase, HotelCSI, Wongnai, LINE MAN' },
  { icon: '○', label: 'Engineering Simulation', description: 'ANSYS, COMSOL, OpenFOAM, DeepXDE, Moldex3D' },
  { icon: '□', label: 'Healthcare', description: 'FHIR R4, Thai NLP, LINE OA, lab analysis' },
];

export type SkillGroup = { category: string; skills: string[] };
export const SKILL_GROUPS: SkillGroup[] = [
  { category: 'AI / Agents', skills: ['LangGraph', 'Claude Sonnet', 'Qwen3', 'MCP', 'A2A', 'Huggingface', 'Typhoon', 'PINNs', 'DeepXDE'] },
  { category: 'Full-Stack', skills: ['Next.js', 'React', 'TypeScript', 'Tailwind', 'FastAPI', 'Express', 'shadcn/ui'] },
  { category: 'Data / Cloud', skills: ['PostgreSQL', 'MongoDB', 'Azure', 'Airflow', 'Docker', 'K8s', 'Pandas', 'Power BI', 'Tableau'] },
  { category: 'Engineering', skills: ['ANSYS Fluent', 'COMSOL', 'OpenFOAM', 'Moldex3D', 'SolidWorks', 'AutoCAD', 'CFD', 'FEA'] },
  { category: 'Platforms', skills: ['Vercel', 'Cloudflare Workers', 'Supabase', 'LINE OA', 'Postman', 'Git', 'LangSmith'] },
];

export type SideProject = { name: string; subtitle: string; description: string; url: string | null };
export const SIDE_PROJECTS: SideProject[] = [
  { name: 'kidpen.org', subtitle: 'Free STEM Education for Thailand', description: 'Open-source STEM platform for Thai students (ม.1+), inspired by Brilliant.org. Next.js, FastAPI, Qwen3. AI tutor mascot Ping.', url: 'https://kidpen.org' },
  { name: 'CarbonScope', subtitle: 'Embodied Carbon Intelligence', description: 'Thai construction sustainability platform. EN 15978 lifecycle carbon, TGO emission factors, EDGE/TREES certification.', url: 'https://bim.getintheq.space' },
  { name: 'FloodSight', subtitle: 'Province-Level Flood Risk Scoring', description: 'ZerveHack 2026 (Climate & Energy). NOAA GHCN-Daily + NVIDIA FourCastNet. Thai Flood Risk Score for 77 provinces.', url: null },
];

export const HERO_STATS = [
  { value: '29', label: 'Live' },
  { value: '50', label: 'Projects' },
  { value: '47', label: 'Workers' },
  { value: '9', label: 'Industries' },
];

export const HERO_CHIPS = ['LangGraph', 'Claude Sonnet', 'Qwen3', 'MCP', 'FastAPI', 'Next.js', 'TypeScript', 'Cloudflare'];

export const SOCIAL_LINKS = [
  { label: 'G', url: 'https://github.com/getintheQ', title: 'GitHub' },
  { label: 'in', url: 'https://linkedin.com/in/getintheq', title: 'LinkedIn' },
  { label: '@', url: 'mailto:kiw.brw@gmail.com', title: 'Email' },
  { label: '↗', url: '/api/resume', title: 'Resume' },
];
