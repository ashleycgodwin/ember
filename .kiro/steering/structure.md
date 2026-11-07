# Ember — Project Structure

## Top-level layout

```
ember/
├── src/
│   ├── app/              # Next.js App Router — pages, layouts, API routes
│   ├── components/       # Shared UI components
│   ├── lib/              # Business logic, utilities, data access helpers
│   ├── hooks/            # Custom React hooks (client-side)
│   ├── types/            # Shared TypeScript types and interfaces
│   └── __tests__/        # Top-level test files (unit, integration)
├── public/               # Static assets (images, icons, fonts)
├── docs/                 # Project documentation, evidence logs
├── .kiro/                # Kiro steering, hooks, agent config
├── next.config.ts
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

## src/app — App Router conventions

```
src/app/
├── layout.tsx            # Root layout (fonts, metadata, global shell)
├── page.tsx              # Home / dashboard — the Rolodex card file view
├── globals.css           # Global Tailwind base styles
├── favicon.ico
├── (auth)/               # Auth group — login, onboarding
│   ├── login/page.tsx
│   └── onboarding/page.tsx
├── contacts/             # Contact routes
│   ├── page.tsx          # All contacts — the spinning card file
│   ├── [id]/page.tsx     # Individual contact card detail
│   └── new/page.tsx      # Add a new contact
├── ashes/                # The Ashes — dormant / Ash-state contacts
│   └── page.tsx
└── api/                  # Route Handlers (server-side API)
    ├── contacts/
    │   └── route.ts
    └── followup/
        └── route.ts      # AI-drafted follow-up generation
```

## src/components — UI components

Organised by feature domain, not by component type.

```
src/components/
├── card/                 # The contact card and its states
│   ├── ContactCard.tsx   # Core card component
│   ├── CardState.tsx     # Glowing / Warm / Cooling / Smoldering / Ash rendering
│   └── CardStack.tsx     # The spinning Rolodex stack
├── contact/              # Contact detail, edit forms
├── followup/             # AI follow-up draft UI
├── ashes/                # The Ashes graveyard view
└── ui/                   # Generic primitives (Button, Input, Modal, etc.)
```

## src/lib — Business logic

```
src/lib/
├── contacts.ts           # CRUD and query helpers for contacts
├── aging.ts              # Card state calculation — maps last-contact date to state
├── followup.ts           # AI follow-up generation (calls LLM API)
└── db.ts                 # Database client / ORM setup
```

## src/types — Shared types

```
src/types/
├── contact.ts            # Contact, CardState enum, interaction log
└── followup.ts           # FollowUpDraft, GenerateFollowUpParams
```

## Naming conventions

- **Files:** `PascalCase` for components (`ContactCard.tsx`), `camelCase` for lib/hooks (`aging.ts`, `useContacts.ts`)
- **Components:** one component per file, named to match the file
- **API routes:** always `route.ts` inside a descriptively named folder
- **Test files:** co-located as `ComponentName.test.tsx` or in `src/__tests__/` for non-component logic

## Card state logic

The `CardState` enum and aging logic live in `src/lib/aging.ts`. Card state is derived from `daysSinceLastContact` and should never be stored — always computed. Thresholds:

| State | Days since last contact |
|---|---|
| Glowing | 0 – 14 |
| Warm | 15 – 30 |
| Cooling | 31 – 60 |
| Smoldering | 61 – 90 |
| Ash | 91+ |

These thresholds are the source of truth. UI, API responses, and tests all derive from this.

## Import paths

Always use the `@/*` alias. Never use relative `../../` imports except within the same immediate folder.

```ts
// correct
import { getCardState } from "@/lib/aging";
import ContactCard from "@/components/card/ContactCard";

// wrong
import { getCardState } from "../../lib/aging";
```
