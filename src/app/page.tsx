/**
 * Ember — home page (Server Component)
 *
 * Contact data and dates are static strings — no new Date() on the server.
 * CardStackClient defers state computation to the browser after hydration,
 * which is where live date comparisons belong.
 */

import CardStackClient from "@/components/card/CardStackClient";
import { DEFAULT_THRESHOLDS } from "@/lib/thresholds";
import type { Contact } from "@/types/contact";

// ── Demo contacts ─────────────────────────────────────────────────────────────
// Dates chosen so that, relative to late 2026, each contact is in a
// different card state. Update these as needed for demos.
const DEMO_CONTACTS: Contact[] = [
  {
    id: "demo-1",
    name: "Dr. Elena Vasquez",
    institution: "MIT",
    field: "Computational Materials Science",
    roleType: "advisor_pi",                // threshold = 14 days
    lastContactDate: "2026-11-05",         // ~2 days ago → Glowing
    notes:
      "Discussed chapter 3 revisions. Enthusiastic about the new simulation approach.",
    whereMet: "Lab, first day of PhD",
    createdAt: "2026-01-10T09:00:00Z",
    updatedAt: "2026-11-05T14:22:00Z",
  },
  {
    id: "demo-2",
    name: "Prof. Kwame Asante",
    institution: "Stanford",
    field: "Astrophysics",
    roleType: "committee_member",          // threshold = 30 days
    lastContactDate: "2026-10-16",         // ~22 days ago → Warm
    notes: "Gave great feedback on the telescope array proposal.",
    whereMet: "AAS conference, Honolulu",
    createdAt: "2025-09-01T08:00:00Z",
    updatedAt: "2026-10-16T11:00:00Z",
  },
  {
    id: "demo-3",
    name: "Dr. Ingrid Solberg",
    institution: "ETH Zürich",
    field: "Earth & Environmental Science",
    roleType: "collaborator",              // threshold = 45 days
    lastContactDate: "2026-09-16",         // ~52 days ago → Cooling
    notes:
      "Co-author on the climate modelling paper. Need to send her the revised dataset.",
    whereMet: "EGU conference, Vienna",
    createdAt: "2025-03-15T10:00:00Z",
    updatedAt: "2026-09-16T09:45:00Z",
  },
  {
    id: "demo-4",
    name: "Marcus Chen",
    institution: "DeepAtom Inc.",
    field: "Quantum Computing",
    roleType: "hiring_manager_recruiter",
    recruiterMode: "active",               // threshold = 7 days
    lastContactDate: "2026-10-27",         // ~11 days ago → Smoldering
    notes:
      "Reached out about a research engineer role. Follow up by end of week.",
    whereMet: "LinkedIn cold outreach",
    createdAt: "2026-10-20T15:00:00Z",
    updatedAt: "2026-10-27T16:30:00Z",
  },
];

export default function Home() {
  return (
    <div
      className="flex flex-col min-h-screen items-center justify-center gap-12 px-4 py-16"
      style={{ background: "var(--bg)" }}
    >
      {/* ── Wordmark ──────────────────────────────────────────────── */}
      <header className="flex flex-col items-center gap-2">
        <h1
          className="font-typewriter text-4xl tracking-[0.18em] uppercase"
          style={{
            color: "rgba(245,240,232,0.92)",
            textShadow: "0 0 24px rgba(245,158,11,0.35)",
          }}
        >
          Ember
        </h1>
        <p
          className="text-xs tracking-widest uppercase"
          style={{ color: "rgba(245,240,232,0.35)" }}
        >
          Every connection starts with a spark
        </p>
      </header>

      {/* ── Card stack ────────────────────────────────────────────── */}
      <CardStackClient
        contacts={DEMO_CONTACTS}
        config={DEFAULT_THRESHOLDS}
      />

      {/* ── Add contact CTA ───────────────────────────────────────── */}
      <button
        className={[
          "font-typewriter text-sm tracking-widest uppercase px-6 py-3 rounded-sm",
          "transition-all duration-200",
          "hover:scale-105 active:scale-95",
        ].join(" ")}
        style={{
          background: "rgba(245,158,11,0.1)",
          border: "1px solid rgba(245,158,11,0.35)",
          color: "rgba(245,240,232,0.8)",
          boxShadow: "0 0 16px rgba(245,158,11,0.12)",
        }}
        aria-label="Add a new contact"
      >
        + Add Contact
      </button>
    </div>
  );
}
