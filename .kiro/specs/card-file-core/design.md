# card-file-core — Design

## Overview

Ember's MVP is a client-only Next.js 16 app (App Router). All state lives in `localStorage`; there is no backend or auth. Business logic runs in plain TypeScript modules under `src/lib/`. UI is built with React 19 Server and Client Components; anything that reads from `localStorage` or handles interaction must be a Client Component (`"use client"`).

---

## Architecture

```
localStorage
  └── ember_contacts      (Contact[])
  └── ember_thresholds    (ThresholdConfig)

src/
  lib/
    thresholds.ts         single source of truth — defaults + config type
    aging.ts              getCardState(contact, config) → CardState
    contacts.ts           CRUD helpers, read/write localStorage
  types/
    contact.ts            Contact, RoleType, RecruiterMode, CardState
    settings.ts           ThresholdConfig
  hooks/
    useContacts.ts        reactive CRUD over contacts
    useThresholds.ts      reactive read/write of threshold config
  app/
    page.tsx              → redirects to /contacts
    contacts/
      page.tsx            CardStack + SearchBar (Client Component shell)
      [id]/page.tsx       ContactDetail
      new/page.tsx        ContactForm (new)
    ashes/
      page.tsx            AshesList
    settings/
      page.tsx            SettingsForm
  components/
    card/
      ContactCard.tsx     visual card — receives Contact + CardState as props
      CardStack.tsx       Rolodex animation shell
      CardStackClient.tsx client boundary wrapper (defers new Date() to browser)
    contact/
      ContactForm.tsx     add/edit form
      ContactDetail.tsx   read-only detail view
    ashes/
      AshesList.tsx       Ash contact list
    ui/
      Button.tsx
      Input.tsx
      Modal.tsx
      SearchBar.tsx
```

State flows in one direction only: `localStorage` → hooks → props → components. Components never read `localStorage` directly.

---

## Data Models

```ts
// src/types/contact.ts

export type RoleType =
  | "advisor_pi"
  | "committee_member"
  | "mentor"
  | "target_company"
  | "hiring_manager_recruiter"
  | "collaborator"
  | "letter_writer"
  | "conference_contact";

export type RecruiterMode = "active" | "maintaining";

export type CardState = "glowing" | "warm" | "cooling" | "smoldering" | "ash";

export interface Contact {
  id: string;                      // UUID
  name: string;
  institution?: string;
  field?: string;
  roleType: RoleType;
  recruiterMode?: RecruiterMode;   // required when roleType = "hiring_manager_recruiter"
  whereMet?: string;
  dateMet?: string;                // ISO date
  notes?: string;
  promised?: string;
  offered?: string;
  lastContactDate: string;         // ISO date — required
  thresholdOverride?: number;      // days — if set, overrides global default for this card
  createdAt: string;               // ISO datetime
  updatedAt: string;               // ISO datetime
}
```

```ts
// src/types/settings.ts

export interface ThresholdConfig {
  advisor_pi: number;
  committee_member: number;
  mentor: number;
  target_company: number;
  hiring_manager_recruiter_active: number;
  hiring_manager_recruiter_maintaining: number;
  collaborator: number;
  letter_writer: number;
  conference_contact: number;
}
```

### Threshold module

```ts
// src/lib/thresholds.ts

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  advisor_pi: 14,
  committee_member: 30,
  mentor: 30,
  target_company: 30,
  hiring_manager_recruiter_active: 7,
  hiring_manager_recruiter_maintaining: 45,
  collaborator: 45,
  letter_writer: 60,
  conference_contact: 90,
};

export function getRoleThreshold(
  roleType: RoleType,
  recruiterMode: RecruiterMode | undefined,
  config: ThresholdConfig
): number

export function getActiveThreshold(
  contact: Contact,
  config: ThresholdConfig
): number
```

Every caller that needs a threshold imports from this module. No other file may define threshold constants.

### Aging / card state

```ts
// src/lib/aging.ts

/**
 * Derives CardState from days since last contact vs. active threshold T.
 *
 * Glowing:    0       – T × 0.5
 * Warm:       T × 0.5 – T
 * Cooling:    T       – T × 2
 * Smoldering: T × 2   – T × 3
 * Ash:        > T × 3
 */
export function getCardState(contact: Contact, config: ThresholdConfig): CardState
export function daysSinceContact(lastContactDate: string): number
```

Card state is computed at render time and **never persisted**.

### localStorage helpers

```ts
// src/lib/contacts.ts

export function loadContacts(): Contact[]
export function saveContacts(contacts: Contact[]): void
export function createContact(data: Omit<Contact, "id" | "createdAt" | "updatedAt">): Contact
export function updateContact(id: string, patch: Partial<Contact>): Contact
export function deleteContact(id: string): void
export function logInteraction(id: string): Contact   // sets lastContactDate = today
```

All functions are synchronous. UUID generation uses `crypto.randomUUID()`.

---

## Components and Interfaces

### `ContactCard`

Props: `contact: Contact`, `config: ThresholdConfig`, `onClick: () => void`, `isActive?: boolean`

Computes `cardState = getCardState(contact, config)` internally. Applies CSS classes keyed to state:

| State | Visual treatment |
|---|---|
| `glowing` | Warm amber/gold glow, bright card-glow-glowing class |
| `warm` | Softer warm tones, card-glow-warm class |
| `cooling` | Neutral, card-glow-cooling class |
| `smoldering` | Muted, card-glow-smoldering class |
| `ash` | Greyscale, card-glow-ash class |

Displays: name (typewriter font), institution, role type label, field, card state badge, days since last contact, ember glow icon. Physical index-card proportions (420×260 px). Hole-punch circle at top-centre aligns with the spindle rod. Fully keyboard and screen-reader accessible.

### `CardStack`

Client Component. Accepts `contacts: Contact[]`, `config: ThresholdConfig`, `onCardClick?: (contact) => void`.

Maintains `currentIndex` / `displayIndex` state. CSS flip animation (`perspective rotateY`) driven by `flipDir` state, split into exit and enter keyframes for both directions. Two decorative behind-stack shadow cards. Spindle rod overlaid at hole-punch position. ‹/› nav buttons. Keyboard: ArrowLeft/ArrowRight/ArrowUp/ArrowDown via window listener scoped to container focus. `aria-live` counter. Empty state message.

### `CardStackClient`

Client Component wrapper. Uses `useSyncExternalStore` to detect client vs. server (lint-clean, no setState-in-effect). Renders a skeleton during SSR, then mounts `CardStack` after hydration. Passes `key={contacts.length}` to reset CardStack state when the list changes.

### `ContactForm`

Client Component. Handles "new" and "edit" modes via optional `initialValues: Partial<Contact>`. Validates required fields and recruiterMode conditional. Shows per-card `thresholdOverride` field. Calls `onSubmit(data)` / `onCancel()` props.

### `SettingsForm`

Client Component. Uses `useThresholds`. Renders 9 numeric inputs (min 1). "Save" calls `update`. "Reset to defaults" opens `Modal` then calls `reset()`.

### `AshesList`

Lists Ash contacts. "Rekindle" button calls `logInteraction`, moving the card back to Glowing.

### Custom hooks

`useContacts` — loads on mount, exposes `contacts`, `create`, `update`, `remove`, `logInteraction`. Writes back to `localStorage` on every mutation.

`useThresholds` — loads on mount, falls back to `DEFAULT_THRESHOLDS`. Exposes `config`, `update(patch)`, `reset()`.

---

## Routing

| Route | Component | Notes |
|---|---|---|
| `/` | redirect → `/contacts` | |
| `/contacts` | `CardStack` + `SearchBar` | Client Component |
| `/contacts/new` | `ContactForm` | Client Component |
| `/contacts/[id]` | `ContactDetail` | reads from localStorage via hook |
| `/contacts/[id]/edit` | `ContactForm` with initial values | Client Component |
| `/ashes` | `AshesList` | Client Component |
| `/settings` | `SettingsForm` | Client Component |

Search filters contacts client-side by name or field (case-insensitive). Only non-Ash contacts are passed to `CardStack`.

Navigation shell: persistent `<nav>` in root layout linking to `/contacts`, `/ashes`, `/settings`.

---

## Error Handling

### localStorage unavailable

`loadContacts` and `loadThresholds` wrap their reads in `try/catch`. If `localStorage` is unavailable (e.g. storage quota exceeded, private browsing on some browsers) or the stored JSON is malformed, they return an empty array / `DEFAULT_THRESHOLDS` respectively and log a warning to the console. The UI degrades gracefully — the app works with an empty state rather than crashing.

### Invalid stored data

On load, if the parsed JSON fails a basic shape check (not an array, or missing required fields like `id` and `name`), the corrupt entry is silently dropped and the remaining valid contacts are used.

### Form validation

All form errors are surfaced inline, adjacent to the offending field, before the data is written to storage. Required field violations and the recruiterMode conditional are caught at submit time. No partial writes occur.

### Contact not found

If a URL like `/contacts/[id]` is visited with a stale or invalid ID (e.g. after deletion), the page shows "Contact not found" with a link back to `/contacts`. No error is thrown.

### Client-only APIs during SSR

`CardStackClient` uses `useSyncExternalStore` to gate any `new Date()` computation behind hydration. `useContacts` and `useThresholds` only read `localStorage` inside effects (after mount), never during SSR. This prevents Next.js 16's prerender from encountering runtime-only APIs.

---

## Correctness Properties

### Property 1: Card state is never stored

*For any* contact object written to `localStorage`, the object must not contain a `cardState` field. Card state is always computed from `lastContactDate` and the active threshold at render time.

**Validates: Requirements 3.2**

**Testable with:** generate random contacts via `fast-check`, call `createContact` + `saveContacts`, then parse the raw JSON from `localStorage` and assert no entry has a `cardState` key.

### Property 2: Active threshold priority

*For any* contact with a `thresholdOverride > 0`, `getActiveThreshold(contact, config)` must return exactly `contact.thresholdOverride`, regardless of what `config` contains for that role type.

*For any* contact with no override (or `thresholdOverride = null/undefined`), `getActiveThreshold` must return the same value as `getRoleThreshold(contact.roleType, contact.recruiterMode, config)`.

**Validates: Requirements 2.3, 9.4**

**Testable with:** property-based test generating arbitrary `(contact, config)` pairs and asserting both branches.

### Property 3: Card state bands are exhaustive and mutually exclusive

*For any* threshold `T > 0` and any `days >= 0`, `getCardState` must return exactly one of the five `CardState` values, and the result must be consistent with the band boundaries (e.g. if `days < T * 0.5` then result is always `"glowing"`).

**Validates: Requirements 3.1**

**Testable with:** `fast-check` generating `(T, days)` pairs and checking the returned state against the expected band.

### Property 4: Navigation wraps around

*For any* card list of length `n >= 2` and any starting index, repeatedly calling `goTo("forward")` exactly `n` times must return the stack to the original index.

**Validates: Requirements 7.2**

**Testable with:** unit test cycling through the full list.

### Property 5: logInteraction always produces Glowing

*For any* contact (regardless of current state), calling `logInteraction` followed immediately by `getCardState` must return `"glowing"`, because `lastContactDate` is set to today (0 days ago) and 0 is always in the Glowing band.

**Validates: Requirements 5.2**

**Testable with:** generate contacts in all five states, call `logInteraction`, assert state is `"glowing"`.

---

## Testing Strategy

### Unit tests (`src/__tests__/` or co-located `*.test.ts`)

- `aging.ts`: `getCardState` — test all five state bands with exact boundary values, for multiple threshold values (7, 14, 30, 90). Include a property-based test verifying that for any threshold T and any `days` in the Glowing band, `getCardState` returns `"glowing"`.
- `thresholds.ts`: `getActiveThreshold` — verify override takes precedence; verify all 9 role+mode combinations return the correct default.
- `contacts.ts`: `createContact`, `updateContact`, `deleteContact`, `logInteraction` — test using a mock `localStorage` (`jsdom` provides it in the Vitest environment).

### Integration / smoke tests

- After adding a contact via `createContact` and calling `loadContacts`, the contact appears and has the correct shape.
- `logInteraction` on an Ash contact followed by `getCardState` returns `"glowing"`.

### Manual acceptance criteria

See `requirements.md` — every requirement block ends with hand-testable acceptance criteria. Run through these in the browser before marking Phase 10 (Task 21) complete.

### Tools

- Vitest 3 with jsdom (already configured)
- `fast-check` for property-based tests (already installed)
- No Storybook — visual review is done in the browser via the demo card stack on the home page
