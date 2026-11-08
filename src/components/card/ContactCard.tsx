import type { Contact, CardState } from "@/types/contact";
import type { ThresholdConfig } from "@/types/settings";
import { getCardState, daysSinceContact } from "@/lib/aging";
import { ROLE_LABELS } from "@/types/contact";

// ─── State display metadata ───────────────────────────────────────────────────

const STATE_META: Record<
  CardState,
  { label: string; symbol: string; badgeClass: string; glowClass: string }
> = {
  glowing: {
    label: "Glowing",
    symbol: "✦",
    badgeClass: "badge-glowing",
    glowClass: "card-glow-glowing",
  },
  warm: {
    label: "Warm",
    symbol: "◈",
    badgeClass: "badge-warm",
    glowClass: "card-glow-warm",
  },
  cooling: {
    label: "Cooling",
    symbol: "◇",
    badgeClass: "badge-cooling",
    glowClass: "card-glow-cooling",
  },
  smoldering: {
    label: "Smoldering",
    symbol: "◌",
    badgeClass: "badge-smoldering",
    glowClass: "card-glow-smoldering",
  },
  ash: {
    label: "Ash",
    symbol: "·",
    badgeClass: "badge-ash",
    glowClass: "card-glow-ash",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface ContactCardProps {
  contact: Contact;
  config: ThresholdConfig;
  /** Called when the card is clicked or activated via keyboard */
  onClick?: () => void;
  /** Whether the card is the currently active (front-facing) card */
  isActive?: boolean;
}

export default function ContactCard({
  contact,
  config,
  onClick,
  isActive = true,
}: ContactCardProps) {
  const state = getCardState(contact, config);
  const days = daysSinceContact(contact.lastContactDate);
  const meta = STATE_META[state];
  const roleLabel = ROLE_LABELS[contact.roleType];

  const daysLabel =
    days === 0 ? "today" : days === 1 ? "yesterday" : `${days}d ago`;

  return (
    <article
      role="button"
      tabIndex={isActive ? 0 : -1}
      aria-label={`${contact.name}${contact.institution ? `, ${contact.institution}` : ""}. ${roleLabel}. Last contact ${daysLabel}. State: ${meta.label}.`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      /* Layout — physical index card proportions (roughly 5×3 inches) */
      className={[
        "relative w-[420px] h-[260px]",
        "rounded-sm",
        "card-paper",
        meta.glowClass,
        "select-none cursor-pointer",
        "transition-all duration-300",
        isActive ? "opacity-100" : "opacity-80 pointer-events-none",
      ].join(" ")}
    >
      {/* ── Top strip: name tab (like the coloured tab on a real card) ── */}
      <div
        className="absolute top-0 left-0 right-0 h-[36px] flex items-center px-4 gap-2 rounded-t-sm"
        style={{
          background:
            state === "glowing"
              ? "linear-gradient(to right, #fef3c7, #fde68a)"
              : state === "warm"
                ? "linear-gradient(to right, #fff7ed, #fed7aa)"
                : state === "cooling"
                  ? "linear-gradient(to right, #f1f5f9, #e2e8f0)"
                  : state === "smoldering"
                    ? "linear-gradient(to right, #fdf2ea, #e5c9ad)"
                    : "linear-gradient(to right, #f4f4f5, #e4e4e7)",
          borderBottom: "1px solid var(--card-rule)",
        }}
      >
        {/* Name — typewriter font, high contrast ink */}
        <h2
          className="font-typewriter text-lg font-normal leading-tight truncate flex-1"
          style={{ color: "var(--ink-primary)" }}
        >
          {contact.name}
        </h2>

        {/* State badge */}
        <span
          className={`flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.badgeClass}`}
          aria-hidden="true"
        >
          {meta.symbol} {meta.label}
        </span>
      </div>

      {/* ── Card body — starts below the tab ── */}
      <div className="absolute inset-0 top-[37px] px-[60px] pt-3 pb-4 flex flex-col gap-1.5">
        {/* Role type */}
        <p
          className="text-[11px] uppercase tracking-widest font-semibold"
          style={{ color: "var(--ink-tertiary)" }}
        >
          {roleLabel}
          {contact.recruiterMode === "active" && " · Active Search"}
          {contact.recruiterMode === "maintaining" && " · Maintaining"}
        </p>

        {/* Institution + field */}
        {(contact.institution || contact.field) && (
          <p
            className="font-typewriter text-[13px] leading-snug"
            style={{ color: "var(--ink-secondary)" }}
          >
            {[contact.institution, contact.field].filter(Boolean).join(" · ")}
          </p>
        )}

        {/* Where / how we met */}
        {contact.whereMet && (
          <p
            className="text-[12px] italic"
            style={{ color: "var(--ink-tertiary)" }}
          >
            Met: {contact.whereMet}
          </p>
        )}

        {/* Notes preview — up to 2 lines */}
        {contact.notes && (
          <p
            className="text-[12px] leading-relaxed mt-0.5 overflow-hidden"
            style={{
              color: "var(--ink-secondary)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {contact.notes}
          </p>
        )}

        {/* ── Footer ── */}
        <div className="absolute bottom-3 left-[60px] right-4 flex justify-between items-end">
          {/* Last contact */}
          <p
            className="font-typewriter text-[11px]"
            style={{ color: "var(--ink-tertiary)" }}
          >
            Last contact:{" "}
            <span style={{ color: "var(--ink-secondary)" }}>{daysLabel}</span>
          </p>

          {/* Ember ember — little glow dot that dims with state */}
          <span
            aria-hidden="true"
            className="text-[18px] leading-none"
            style={{
              filter:
                state === "glowing"
                  ? "drop-shadow(0 0 6px #f59e0b)"
                  : state === "warm"
                    ? "drop-shadow(0 0 4px #d97706)"
                    : state === "cooling"
                      ? "drop-shadow(0 0 2px #92400e)"
                      : "none",
              opacity:
                state === "ash"
                  ? 0.25
                  : state === "smoldering"
                    ? 0.45
                    : 1,
            }}
          >
            {state === "ash" ? "·" : "🔥"}
          </span>
        </div>
      </div>

      {/* Hole-punch circle — top centre, like a real Rolodex card */}
      <div
        aria-hidden="true"
        className="absolute top-[13px] left-1/2 -translate-x-1/2 w-4 h-4 rounded-full"
        style={{
          background: "var(--bg)",
          border: "1.5px solid var(--card-rule)",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)",
        }}
      />
    </article>
  );
}
