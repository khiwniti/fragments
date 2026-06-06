# Coding Conventions

**Analysis Date:** 2026-06-07

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `Chat.tsx`, `Navbar.tsx`)
- Utilities/hooks: camelCase (e.g., `utils.ts`, `storage.ts`, `auth.ts`)
- Server actions: kebab-case with `.ts` extension (e.g., `validate-email.ts`, `publish.ts`)
- Types/interfaces: camelCase or PascalCase defined in `lib/types.ts`

**Functions:**
- camelCase for functions and variables (e.g., `getOrCreateAnonId`, `handleAPIError`)
- Named exports for utilities (e.g., `export function cn()`)
- Default exports for Next.js pages/layouts

**Variables:**
- camelCase (e.g., `isLoading`, `consoleErrors`, `starterChips`)
- Type annotations on function parameters and return types

**Types:**
- PascalCase for interfaces and types (e.g., `FragmentSchema`, `ExecutionResult`, `SavedSession`)
- Zod schemas with PascalCase names (e.g., `fragmentSchema`, `resumeContentSchema`)
- Use `z.infer<typeof ...>` pattern for TypeScript types from Zod schemas

## Code Style

**Formatting:**
- Tool: Prettier
- Config in `.prettierrc`: `singleQuote: true`, `semi: false`
- Import sorting plugin: `@trivago/prettier-plugin-sort-imports`

**Linting:**
- Tool: ESLint
- Config: `.eslintrc.json` extends `next/core-web-vitals`
- Runs via `npm run lint`

**TypeScript:**
- Strict mode enabled in `tsconfig.json`
- `skipLibCheck: true` to avoid library type issues
- Path alias `@/*` maps to project root (e.g., `@/lib/schema`)

## Import Organization

**Order (via prettier-plugin-sort-imports):**
1. React/framework imports
2. Third-party library imports
3. Internal imports (`@/` path aliases)
4. Relative imports

**Path Aliases:**
- `@/*` = project root (e.g., `@/components/chat`, `@/lib/utils`)

**Example import pattern:**
```typescript
import { useEffect } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { LoaderIcon, Terminal, FileText } from 'lucide-react'
import { Message } from '@/lib/messages'
import { FragmentSchema } from '@/lib/schema'
```

## Error Handling

**Centralized error utilities:** `lib/api-errors.ts`

**Patterns:**
- Helper functions check error properties: `isRateLimitError()`, `isOverloadedError()`, `isAccessDeniedError()`
- `handleAPIError()` returns appropriate `Response` objects with status codes
- Console error logging for debugging (e.g., `console.error('API Error:', error)`)
- Server-side errors return generic messages to client for security

**Server Actions (Next.js):**
```typescript
'use server'
export async function validateEmail(email: string): Promise<boolean> {
  // ...
}
```

**Try/catch in utilities:**
```typescript
try {
  const raw = localStorage.getItem(KEY)
  return raw ? JSON.parse(raw) : null
} catch {
  return null  // Fail gracefully
}
```

## Logging

**Framework:** `console` (no structured logging library detected)

**Patterns:**
- `console.error()` for API errors and unexpected failures
- `console.warn()` for non-critical issues (e.g., 'Supabase is not initialized')

## Comments

**When to Comment:**
- JSDoc on exported functions/interfaces describing purpose and parameters
- Inline comments for non-obvious logic or workarounds
- `'use server'` directive at top of server action files

**JSDoc Example:**
```typescript
/**
 * Shared error handling utilities for API routes
 */
export interface APIError {
  statusCode?: number
  message: string
}
```

## Function Design

**Size:** No strict limits observed; prefer small, focused functions

**Parameters:**
- Explicit typing on all parameters
- Destructuring for object parameters in components
- Optional parameters marked with `?`

**Return Values:**
- Always annotate return types for exported functions
- Use Zod schemas with `z.infer<typeof schema>` for structured returns

## Module Design

**Exports:**
- Named exports for utilities and types
- Default exports for React components and Next.js pages
- Barrel pattern: `lib/index.ts` not detected (import directly from modules)

**Server vs Client:**
- Server-only code in `.ts` files with `'use server'` directive or in `app/actions/` directory
- Client components use React hooks; server components are async by default

## Component Patterns

**React Component Structure:**
```typescript
export function ChatComponent({ prop1, prop2 }: { prop1: Type, prop2: Type }) {
  useEffect(() => {
    // Side effects
  }, [dependencies])

  return (
    <div>...</div>
  )
}
```

**Styling:** Tailwind CSS classes with conditional `cn()` utility for merging class names

---

*Convention analysis: 2026-06-07*