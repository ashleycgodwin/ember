# card-file-core — Requirements

## Overview

The card file is Ember's core feature: a Rolodex-style view of a user's academic and professional contacts. Cards age visually over time based on each contact's role-specific "goes cold" threshold. Users can add, edit, delete, and browse cards; search by name or field; and adjust thresholds globally or per card. All data lives in `localStorage` — no account or login required.

---

## Glossary

| Term | Meaning |
|---|---|
| **Card** | A contact record, rendered as a physical index card |
| **Card state** | A visual/semantic state derived from days since last contact vs. the active threshold: Glowing → Warm → Cooling → Smoldering → Ash |
| **Threshold** | The number of days after which a card moves to a worse state (one threshold per role type, with a per-card override) |
| **Role type** | The contact's relationship to the user (advisor, committee member, etc.) |
| **Active threshold** | The threshold that governs a specific card: the card-level override if set, otherwise the global default for that role type |
| **Recruiter mode** | A sub-mode of the Hiring Manager / Recruiter role type that changes its default threshold |
| **The Ashes** | The view for contacts whose card state has reached Ash (91 + days beyond their threshold) |

---

## 1. Data model

### REQ-1.1 — Contact fields

**When** a user creates or edits a contact,  
**the system shall** store the following fields:

| Field | Type | Required? |
|---|---|---|
| `id` | UUID (auto-generated) | Yes |
| `name` | String | Yes |
| `institution` | String | No |
| `field` | String (free text) | No |
| `roleType` | Enum (see §2) | Yes |
| `recruiterMode` | `"active"` \| `"maintaining"` \| `null` | Only when roleType = Hiring Manager / Recruiter |
| `whereMet` | String | No |
| `dateMet` | ISO date string | No |
| `notes` | String (multiline) | No |
| `promised` | String — what the user promised the contact | No |
| `offered` | String — what the contact offered the user | No |
| `lastContactDate` | ISO date string | Yes |
| `thresholdOverride` | Number (days) \| `null` | No — overrides global default for this card |
| `createdAt` | ISO date string (auto) | Yes |
| `updatedAt` | ISO date string (auto) | Yes |

**Acceptance criteria:**
- Add a contact with only name, role type, and last contact date → card saves successfully.
- Add a contact with every field filled in → all values persist after a page refresh.
- A contact with `roleType = "hiring_manager_recruiter"` and `recruiterMode = null` cannot be saved; the form shows a validation error asking the user to pick a recruiter mode.

---

### REQ-1.2 — Persistence

**When** the user creates, edits, or deletes a contact,  
**the system shall** immediately write the updated contact list to `localStorage` under the key `ember_contacts`.

**Acceptance criteria:**
- Add a contact, then hard-refresh the page → the contact is still visible.
- Edit a contact's name, then hard-refresh → the edited name is shown.
- Delete a contact, then hard-refresh → the contact is gone.

---

### REQ-1.3 — Threshold configuration persistence

**The system shall** store the user's global threshold settings in `localStorage` under the key `ember_thresholds`, separate from contact data.

**Acceptance criteria:**
- Change the default threshold for Advisor/PI to 21 days, then hard-refresh → the Settings screen still shows 21 days for Advisor/PI.

---

## 2. Role types and default thresholds

### REQ-2.1 — Role type enum

**The system shall** support exactly the following role types:

| Role type key | Display label | Default threshold |
|---|---|---|
| `advisor_pi` | Advisor / PI | 14 days |
| `committee_member` | Committee Member | 30 days |
| `mentor` | Mentor | 30 days |
| `target_company` | Target Company Contact | 30 days |
| `hiring_manager_recruiter` | Hiring Manager / Recruiter | *(mode-dependent — see REQ-2.2)* |
| `collaborator` | Collaborator | 45 days |
| `letter_writer` | Letter Writer | 60 days |
| `conference_contact` | Conference Contact | 90 days |

**Acceptance criteria:**
- The "Role Type" dropdown on the add/edit form contains exactly these eight options, in this order.

---

### REQ-2.2 — Recruiter mode

**When** a user selects Hiring Manager / Recruiter as the role type,  
**the system shall** require a recruiter mode selection:

| Mode key | Display label | Default threshold |
|---|---|---|
| `active` | Actively Job Searching | 7 days |
| `maintaining` | Maintaining the Relationship | 45 days |

**Acceptance criteria:**
- Select Hiring Manager / Recruiter → a "Mode" field appears below the role type.
- Select any other role type → the Mode field is hidden.
- Try to save with role type = Hiring Manager / Recruiter and no mode selected → form shows an error; save is blocked.

---

### REQ-2.3 — Single source of truth for thresholds

**The system shall** resolve a card's active threshold from a single config object (`thresholdConfig`) in this priority order:
1. Card-level `thresholdOverride` if set (non-null).
2. Global default for the card's role type (and recruiter mode, if applicable) from `ember_thresholds`.

No threshold value shall be hard-coded outside `src/lib/thresholds.ts`.

**Acceptance criteria:**
- Change the global default for Collaborator to 20 days in Settings → an existing Collaborator card with no override now turns Warm at 20 days, not 45.
- Set a per-card override of 10 days on a Collaborator card → that card uses 10 days; other Collaborator cards unaffected.

---

## 3. Card state (aging)

### REQ-3.1 — State derivation

**When** the system computes card state,  
**the system shall** derive it from `daysSinceLastContact` relative to the card's **active threshold** (`T`):

| State | Condition |
|---|---|
| Glowing | 0 – T × 0.5 days |
| Warm | T × 0.5 – T days |
| Cooling | T – T × 2 days |
| Smoldering | T × 2 – T × 3 days |
| Ash | > T × 3 days |

> Example with T = 14: Glowing 0–7, Warm 7–14, Cooling 14–28, Smoldering 28–42, Ash 42+.

**Acceptance criteria:**
- With threshold = 14, a contact last touched 6 days ago → Glowing.
- With threshold = 14, a contact last touched 10 days ago → Warm.
- With threshold = 14, a contact last touched 20 days ago → Cooling.
- With threshold = 14, a contact last touched 35 days ago → Smoldering.
- With threshold = 14, a contact last touched 50 days ago → Ash.
- With threshold = 30, a contact last touched 20 days ago → Warm.

---

### REQ-3.2 — Card state is never stored

**The system shall** compute card state at render time and never write it to `localStorage` or any persistent store.

**Acceptance criteria:**
- Inspect `localStorage` after using the app → `ember_contacts` contains no `cardState` field on any contact object.

---

### REQ-3.3 — Visual differentiation by state

**The system shall** render cards with visually distinct styles for each state:

| State | Visual treatment |
|---|---|
| Glowing | Warm amber/gold glow, bright |
| Warm | Softer warm tones, slight glow |
| Cooling | Neutral grey-blue, no glow |
| Smoldering | Muted orange-brown, faded |
| Ash | Desaturated grey, nearly monochrome |

**Acceptance criteria:**
- Five cards with one in each state are visible on screen → each card has a perceptibly different background or glow treatment.

---

## 4. Add a contact

### REQ-4.1 — Add contact form

**When** the user clicks "Add Contact",  
**the system shall** display a form with all fields from REQ-1.1.

**Acceptance criteria:**
- Clicking "Add Contact" opens the form.
- Required fields (name, role type, last contact date) are marked visually.
- Submitting with an empty name field shows an inline error; the contact is not saved.
- Submitting with a valid name, role type, and last contact date saves the contact and dismisses the form.
- The new card appears in the card file immediately after saving (no page refresh needed).

---

### REQ-4.2 — Last contact date defaults to today

**When** the add contact form is opened,  
**the system shall** pre-populate the last contact date field with today's date.

**Acceptance criteria:**
- Open the add form → the last contact date field shows today's date.
- Change the date to a past date, save → the card uses the chosen past date.

---

## 5. Edit a contact

### REQ-5.1 — Edit contact

**When** the user opens a contact's detail view and clicks "Edit",  
**the system shall** display the edit form pre-populated with all existing field values.

**Acceptance criteria:**
- Open a card, click Edit → all saved fields are visible and editable.
- Change the institution, save → the updated institution appears on the card.
- Cancel → no changes are saved.

---

### REQ-5.2 — Log an interaction (rekindle)

**When** the user clicks "Log Interaction" on a contact card,  
**the system shall** update `lastContactDate` to today and save.

**Acceptance criteria:**
- A Smoldering card → click "Log Interaction" → the card immediately returns to Glowing.
- The updated `lastContactDate` persists after a hard refresh.

---

## 6. Delete a contact

### REQ-6.1 — Delete with confirmation

**When** the user clicks "Delete" on a contact,  
**the system shall** display a confirmation prompt before deleting.

**Acceptance criteria:**
- Click Delete → a confirmation dialog appears with the contact's name.
- Confirm → contact is removed from the card file; it does not reappear on refresh.
- Cancel → contact remains; no data is changed.

---

## 7. Card file view (Rolodex)

### REQ-7.1 — Card stack display

**The system shall** display all non-Ash contacts as a stacked card file on the main page.

**Acceptance criteria:**
- At least one non-Ash contact exists → the card stack is visible.
- No non-Ash contacts exist → an empty-state message is shown ("Your card file is empty. Add your first contact to get started.").

---

### REQ-7.2 — Card navigation

**When** the user clicks a forward/back control or swipes the stack,  
**the system shall** cycle through cards one at a time in a visually animated manner that evokes a spinning Rolodex.

**Acceptance criteria:**
- With 3+ cards, click the "next" control → the stack advances to the next card with a flip or spin animation.
- Click "previous" → stack goes back one card.
- Navigating wraps around (last card → first card).

---

### REQ-7.3 — Clicking a card opens detail

**When** the user clicks on the front-facing card,  
**the system shall** open that contact's detail view.

**Acceptance criteria:**
- Click the visible card → detail view opens showing all saved fields.
- Browser back button returns to the card file at the same position.

---

### REQ-7.4 — The Ashes separation

**The system shall** exclude Ash-state contacts from the main card file view and display them only in The Ashes view (`/ashes`).

**Acceptance criteria:**
- A contact whose computed state is Ash does not appear in the main card stack.
- Navigate to `/ashes` → Ash-state contacts are listed there.

---

## 8. Search

### REQ-8.1 — Search by name or field

**When** the user types in the search input,  
**the system shall** filter the displayed cards in real time to show only contacts whose `name` or `field` contains the search string (case-insensitive).

**Acceptance criteria:**
- Type "Maria" → only cards with "Maria" in the name or field are shown.
- Type "astronomy" → only cards with "astronomy" in their field are shown.
- Clear the search input → all cards reappear.
- Search is case-insensitive: "MARIA" matches "Maria".
- No results → show "No contacts match your search."

---

### REQ-8.2 — Search does not affect The Ashes

**When** the user searches,  
**the system shall** only filter the main card file; Ash contacts remain in The Ashes and are unaffected.

**Acceptance criteria:**
- Search for a name that belongs to an Ash contact → that contact does not appear in the main card file results.

---

## 9. Settings — global thresholds

### REQ-9.1 — Settings screen

**The system shall** provide a Settings screen accessible from the main navigation.

**Acceptance criteria:**
- A "Settings" link or icon is visible in the app's navigation.
- Clicking it navigates to `/settings`.

---

### REQ-9.2 — Edit global defaults

**When** the user is on the Settings screen,  
**the system shall** display an editable numeric input for each role type's default threshold (and both recruiter modes separately).

**Acceptance criteria:**
- Settings screen shows 9 editable rows: one for each of the 7 non-recruiter role types, plus "Actively Job Searching" and "Maintaining the Relationship".
- Change a value and save → the new value is stored in `ember_thresholds`.
- Existing cards with no per-card override use the new global value immediately.

---

### REQ-9.3 — Reset to defaults

**When** the user clicks "Reset to defaults" on the Settings screen,  
**the system shall** restore all global thresholds to the values in REQ-2.1 and REQ-2.2.

**Acceptance criteria:**
- Change Advisor/PI to 99 days, save. Click "Reset to defaults", confirm → Advisor/PI reverts to 14 days.
- Confirmation dialog appears before resetting (destructive action).

---

### REQ-9.4 — Per-card threshold override

**When** the user edits a contact,  
**the system shall** display an optional "Custom threshold (days)" field that, if set, overrides the global default for that card only.

**Acceptance criteria:**
- Leave the override blank → card uses the global default.
- Set override to 10 days → that card's state uses 10 days as T.
- Clear the override (set back to blank) → card reverts to the global default.
- The override value persists after a page refresh.

---

## 10. Non-functional requirements

### REQ-10.1 — No login

**The system shall** not require authentication. All data is stored in the user's browser.

**Acceptance criteria:**
- Open the app in a private/incognito window → all features are accessible without signing in.

---

### REQ-10.2 — Accessibility

**The system shall** meet WCAG 2.1 AA standards for keyboard navigation and screen-reader labelling on all interactive elements.

**Acceptance criteria:**
- Tab through the add contact form → focus moves through all fields in logical order.
- All form inputs have visible labels (not placeholder-only).
- The card navigation controls have `aria-label` attributes.

---

### REQ-10.3 — Responsive layout

**The system shall** be usable on screen widths from 375 px (mobile) to 1440 px (desktop).

**Acceptance criteria:**
- View the card file on a 375 px wide screen → cards are readable and controls are tappable without horizontal scrolling.

---

### REQ-10.4 — Performance

**The system shall** render the card file with up to 200 contacts without perceptible lag (< 200 ms to interactive after navigation).

**Acceptance criteria:**
- Add 50 contacts → the card file loads and animates without visible stutter.
