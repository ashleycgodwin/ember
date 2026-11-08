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
  id: string;
  name: string;
  institution?: string;
  field?: string;
  roleType: RoleType;
  recruiterMode?: RecruiterMode;
  whereMet?: string;
  dateMet?: string;
  notes?: string;
  promised?: string;
  offered?: string;
  lastContactDate: string; // ISO date string
  thresholdOverride?: number; // days — overrides global default for this card
  createdAt: string;
  updatedAt: string;
}

/** Human-readable label for each role type */
export const ROLE_LABELS: Record<RoleType, string> = {
  advisor_pi: "Advisor / PI",
  committee_member: "Committee Member",
  mentor: "Mentor",
  target_company: "Target Company Contact",
  hiring_manager_recruiter: "Hiring Manager / Recruiter",
  collaborator: "Collaborator",
  letter_writer: "Letter Writer",
  conference_contact: "Conference Contact",
};
