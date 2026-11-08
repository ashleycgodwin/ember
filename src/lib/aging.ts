import type { Contact, CardState } from "@/types/contact";
import type { ThresholdConfig } from "@/types/settings";
import { getActiveThreshold } from "@/lib/thresholds";

/**
 * Computes the number of whole days between lastContactDate and today.
 * A future date is treated as 0 days (Glowing).
 */
export function daysSinceContact(lastContactDate: string): number {
  const last = new Date(lastContactDate);
  const now = new Date();
  // Zero out time components so we compare calendar days
  const lastDay = Date.UTC(last.getFullYear(), last.getMonth(), last.getDate());
  const nowDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.floor((nowDay - lastDay) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

/**
 * Derives CardState from days since last contact vs. the card's active threshold T.
 *
 * Glowing:    0       – T × 0.5   (fresh)
 * Warm:       T × 0.5 – T         (recent)
 * Cooling:    T       – T × 2     (going quiet)
 * Smoldering: T × 2   – T × 3    (fading)
 * Ash:        > T × 3             (dormant)
 *
 * Card state is NEVER stored — always computed at render time.
 */
export function getCardState(
  contact: Contact,
  config: ThresholdConfig
): CardState {
  const T = getActiveThreshold(contact, config);
  const days = daysSinceContact(contact.lastContactDate);

  if (days < T * 0.5) return "glowing";
  if (days < T)       return "warm";
  if (days < T * 2)   return "cooling";
  if (days < T * 3)   return "smoldering";
  return "ash";
}
