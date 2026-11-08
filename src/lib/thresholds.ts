import type { ThresholdConfig } from "@/types/settings";
import type { Contact, RoleType, RecruiterMode } from "@/types/contact";

/**
 * Default "goes cold" thresholds in days per role type.
 * This is the single source of truth — no other file may define threshold constants.
 */
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

/**
 * Returns the base threshold (days) for a given role type from the config.
 * Does NOT apply per-card overrides.
 */
export function getRoleThreshold(
  roleType: RoleType,
  recruiterMode: RecruiterMode | undefined,
  config: ThresholdConfig
): number {
  if (roleType === "hiring_manager_recruiter") {
    return recruiterMode === "active"
      ? config.hiring_manager_recruiter_active
      : config.hiring_manager_recruiter_maintaining;
  }
  return config[roleType];
}

/**
 * Returns the effective threshold that governs a specific card:
 * - card-level thresholdOverride if set (non-null, > 0)
 * - otherwise the global role-type default from config
 */
export function getActiveThreshold(
  contact: Contact,
  config: ThresholdConfig
): number {
  if (contact.thresholdOverride != null && contact.thresholdOverride > 0) {
    return contact.thresholdOverride;
  }
  return getRoleThreshold(contact.roleType, contact.recruiterMode, config);
}
