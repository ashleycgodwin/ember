# Implementation Plan

## Overview

Implements Ember's MVP card file: contact CRUD, Rolodex card stack view, card aging, search, per-role thresholds with global settings and per-card overrides, and The Ashes. All data in `localStorage`, no auth. 21 tasks across 10 phases, building foundation → UI primitives → forms → card display → pages → Ashes → Settings → nav → polish → verification.

---

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1", "7", "13", "19"],
      "description": "Independent foundation: types, UI primitives, root redirect, layout nav"
    },
    {
      "wave": 2,
      "tasks": ["2", "4"],
      "description": "Depends on types (task 1): threshold module and localStorage helpers"
    },
    {
      "wave": 3,
      "tasks": ["3", "5", "6"],
      "description": "Depends on types + threshold module (tasks 1-2): aging, useContacts, useThresholds"
    },
    {
      "wave": 4,
      "tasks": ["8", "10"],
      "description": "Depends on types + lib (tasks 1-3): ContactForm and ContactCard"
    },
    {
      "wave": 5,
      "tasks": ["9", "11"],
      "description": "Depends on hooks + form/card (tasks 4-8, 10): new contact page and CardStack"
    },
    {
      "wave": 6,
      "tasks": ["12", "14", "18"],
      "description": "Depends on hooks + CardStack (tasks 5-6, 10-11): contacts index, ContactDetail, SettingsForm"
    },
    {
      "wave": 7,
      "tasks": ["15", "16", "17"],
      "description": "Depends on wave 6 components: detail page, edit page, AshesList"
    },
    {
      "wave": 8,
      "tasks": ["20"],
      "description": "Polish: depends on card components being in place (tasks 10-11)"
    },
    {
      "wave": 9,
      "tasks": ["21"],
      "description": "Verification pass: depends on all tasks"
    }
  ]
}
```

---

## Tasks

- [ ] 1. Create shared TypeScript types
  - 1.1 Create `src/types/contact.ts` — `RoleType`, `RecruiterMode`, `CardState`, `Contact` interface (all fields from REQ-1.1)
  - 1.2 Create `src/types/settings.ts` — `ThresholdConfig` interface (9 keys)
  - Verify: `npm run build` passes with no type errors

- [ ] 2. Implement the threshold module
  - 2.1 Create `src/lib/thresholds.ts`
  - 2.2 Export `DEFAULT_THRESHOLDS` constant with all 9 values from REQ-2.1 / REQ-2.2
  - 2.3 Export `getRoleThreshold(roleType, recruiterMode, config)` — returns the config value for the role
  - 2.4 Export `getActiveThreshold(contact, config)` — returns override if set, else `getRoleThreshold`
  - Verify: `npm test` — existing example test still passes; module imports without error

- [ ] 3. Implement card state aging
  - 3.1 Create `src/lib/aging.ts`
  - 3.2 Export `getCardState(contact, config): CardState` using the proportional threshold bands from REQ-3.1
  - 3.3 Handle edge case: `lastContactDate` in the future → treat as 0 days → Glowing
  - Verify: Hand-test the six acceptance criteria in REQ-3.1 in the browser console, or write a quick unit test

- [ ] 4. Implement localStorage contact helpers
  - 4.1 Create `src/lib/contacts.ts`
  - 4.2 Implement `loadContacts`, `saveContacts`, `createContact`, `updateContact`, `deleteContact`, `logInteraction`
  - 4.3 `createContact` generates a UUID via `crypto.randomUUID()` and sets `createdAt`/`updatedAt`
  - 4.4 `updateContact` merges the patch and updates `updatedAt`
  - Verify: `npm run build` passes

- [ ] 5. Create useContacts hook
  - 5.1 Create `src/hooks/useContacts.ts` (`"use client"`)
  - 5.2 On mount, load contacts from `localStorage`
  - 5.3 Expose `contacts`, `create`, `update`, `remove`, `logInteraction`
  - 5.4 Each mutation updates local state and writes back to `localStorage`
  - Verify: `npm run build` passes

- [ ] 6. Create useThresholds hook
  - 6.1 Create `src/hooks/useThresholds.ts` (`"use client"`)
  - 6.2 On mount, read `ember_thresholds` from `localStorage`; fall back to `DEFAULT_THRESHOLDS` if absent
  - 6.3 Expose `config`, `update(patch)`, `reset()`
  - 6.4 `reset()` writes `DEFAULT_THRESHOLDS` back to `localStorage`
  - Verify: `npm run build` passes

- [ ] 7. Build generic UI components
  - 7.1 Create `src/components/ui/Button.tsx` — accepts `variant` (`primary` | `secondary` | `danger`), `disabled`, `onClick`
  - 7.2 Create `src/components/ui/Input.tsx` — text/number/date input with label, error message slot, accessible `id`/`htmlFor` wiring
  - 7.3 Create `src/components/ui/Modal.tsx` — dialog overlay with close button; traps focus; `aria-modal="true"`
  - 7.4 Create `src/components/ui/SearchBar.tsx` — controlled text input with clear button; `aria-label="Search contacts"`
  - Verify: `npm run build` passes; `npm run lint` passes

- [ ] 8. Build ContactForm
  - 8.1 Create `src/components/contact/ContactForm.tsx` (`"use client"`)
  - 8.2 Role type rendered as a `<select>` with the 8 options from REQ-2.1 in order
  - 8.3 When `roleType = "hiring_manager_recruiter"`, show a "Mode" radio group; hide otherwise
  - 8.4 Per-card `thresholdOverride` field: optional numeric input; leave blank = no override
  - 8.5 Validation on submit: name required, roleType required, lastContactDate required, recruiterMode required when applicable
  - 8.6 `lastContactDate` defaults to today on mount when no `initialValues` provided
  - 8.7 Accepts optional `initialValues: Partial<Contact>` prop for edit mode; calls `onSubmit(data)` / `onCancel()`
  - Verify: Open `/contacts/new` in browser — form renders; try submitting empty → errors appear

- [ ] 9. Wire up new contact page
  - 9.1 Create `src/app/contacts/new/page.tsx` — renders `ContactForm`, on submit calls `create` from `useContacts`, then navigates to `/contacts`
  - Verify: Add a contact via the form → appears at `/contacts`; hard-refresh → still in `localStorage`

- [ ] 10. Build ContactCard
  - 10.1 Create `src/components/card/ContactCard.tsx`
  - 10.2 Props: `contact: Contact`, `config: ThresholdConfig`, `onClick: () => void`
  - 10.3 Computes `cardState` via `getCardState(contact, config)`
  - 10.4 Applies state-specific CSS glow classes (see Design doc)
  - 10.5 Displays: name (typewriter font), institution, role type label, field, card state badge, days-since-last-contact
  - 10.6 Accessible: `role="button"`, `tabIndex={0}`, descriptive `aria-label`
  - Verify: `npm run build` passes; `npm run lint` passes

- [ ] 11. Build CardStack
  - 11.1 Create `src/components/card/CardStack.tsx` (`"use client"`)
  - 11.2 Accepts `contacts: Contact[]`, `config: ThresholdConfig`; maintains `currentIndex` state
  - 11.3 Previous/next controls with `aria-label`; keyboard navigation (ArrowLeft/ArrowRight)
  - 11.4 Navigation wraps around (index loops); CSS flip animation on index change
  - 11.5 Empty state: renders the message from REQ-7.1 when `contacts` is empty
  - Verify: Render with 3 contacts in browser → can navigate forward/back; wraps at ends

- [ ] 12. Build the contacts index page
  - 12.1 Create `src/app/contacts/page.tsx` (`"use client"`)
  - 12.2 Uses `useContacts` and `useThresholds`; filters out Ash contacts before passing to `CardStack`
  - 12.3 Renders `SearchBar`; filters `contacts` by name/field (case-insensitive) per REQ-8.1
  - 12.4 "Add Contact" button → navigates to `/contacts/new`
  - 12.5 When search returns no results → show "No contacts match your search."
  - Verify: Contacts added in task 9 appear here; search filters correctly

- [ ] 13. Update root page to redirect
  - 13.1 Update `src/app/page.tsx` to redirect to `/contacts`
  - Verify: Navigate to `/` → lands on `/contacts`

- [ ] 14. Build ContactDetail
  - 14.1 Create `src/components/contact/ContactDetail.tsx`
  - 14.2 Displays all saved fields in read-only form; shows computed card state and days since last contact
  - 14.3 "Log Interaction" button calls `logInteraction` from `useContacts` → card state recalculates immediately
  - 14.4 "Delete" opens a `Modal` confirmation with the contact's name; on confirm calls `remove` and navigates to `/contacts`
  - Verify: Open a contact → all fields visible; Log Interaction → days resets; Delete → contact gone

- [ ] 15. Wire up contact detail page
  - 15.1 Create `src/app/contacts/[id]/page.tsx` — reads `id` from params, looks up contact via `useContacts`, renders `ContactDetail`
  - 15.2 If contact not found → show "Contact not found" with a link back to `/contacts`
  - Verify: Click a card in the stack → detail page opens with correct data; browser back → returns to card file

- [ ] 16. Wire up edit page
  - 16.1 Create `src/app/contacts/[id]/edit/page.tsx` — renders `ContactForm` with `initialValues` from the contact; on submit calls `update`, navigates to `/contacts/[id]`
  - Verify: Edit a contact's institution → updated value shown on detail page; hard-refresh → persists

- [ ] 17. Build AshesList and Ashes page
  - 17.1 Create `src/components/ashes/AshesList.tsx` — lists Ash contacts with name, institution, role type, days since last contact, and "Rekindle" button
  - 17.2 "Rekindle" calls `logInteraction` → contact moves back to Glowing and disappears from the list
  - 17.3 Empty state: "The Ashes are quiet. No dormant contacts right now."
  - 17.4 Create `src/app/ashes/page.tsx` — Client Component wrapping `AshesList`
  - Verify: Set a contact's `lastContactDate` far in the past → appears in The Ashes; click Rekindle → moves back to card file

- [ ] 18. Build SettingsForm and Settings page
  - 18.1 Create `src/components/settings/SettingsForm.tsx` (`"use client"`) — uses `useThresholds`
  - 18.2 Renders 9 labeled numeric inputs (one per config key) with clear display names; all have minimum value of 1
  - 18.3 "Save" button writes changes via `update`; shows brief success confirmation ("Settings saved")
  - 18.4 "Reset to defaults" button → opens `Modal` confirmation → calls `reset()` on confirm
  - 18.5 Create `src/app/settings/page.tsx` wrapping `SettingsForm`
  - Verify: Change Advisor/PI to 7 days, save, hard-refresh → value persists; Reset to defaults → back to 14

- [ ] 19. Update root layout with navigation
  - 19.1 Update `src/app/layout.tsx` to include a persistent `<nav>` with links to `/contacts`, `/ashes`, `/settings`
  - 19.2 Use Next.js `<Link>` for all nav links; active link is visually distinguished
  - 19.3 Nav is keyboard accessible; each link has a descriptive label
  - Verify: All three nav links work; active state is visible; tab key moves through nav

- [ ] 20. Global styles and Ember visual identity
  - 20.1 Confirm `src/app/globals.css` dark background, ember glow system, and typewriter font variable are in place
  - 20.2 Ensure the five card state glow classes in `ContactCard` are visually distinct against the background
  - 20.3 Verify Special Elite (typewriter) and Geist Sans fonts load correctly
  - Verify: App looks intentional; card states are clearly differentiated at a glance

- [ ] 21. Run full acceptance criteria check
  - 21.1 Work through every "Acceptance criteria" bullet in `requirements.md` manually in the browser
  - 21.2 Note any failures and fix them
  - 21.3 `npm run build` → zero errors; `npm run lint` → zero warnings or errors; `npm test` → all tests pass
  - Verify: All criteria in REQ-1.1 through REQ-10.4 pass manual testing

---

## Notes

- Tasks 1–3 (types, thresholds, aging) are the pure-logic foundation. They have no UI dependencies and can be unit-tested in isolation before any component work starts.
- Tasks 10–11 (`ContactCard` and `CardStack`) are already partially implemented as part of the Rolodex visual styling work. Review the existing implementations before re-doing them. Task 20 may be a quick verification rather than new work.
- The visual demo on the home page (`src/app/page.tsx`) uses hardcoded ISO date strings to keep it as a Server Component and avoid Next.js 16's prerender restriction on `new Date()`. When task 12 wires up the real `/contacts` page, the demo page will be replaced by task 13's redirect.
- Card state is **never stored** — computed on every render. Any implementation that saves `cardState` to `localStorage` is incorrect.
- The recruiter mode sub-threshold uses two separate keys in `ThresholdConfig` (`hiring_manager_recruiter_active` and `hiring_manager_recruiter_maintaining`), not a nested object.
