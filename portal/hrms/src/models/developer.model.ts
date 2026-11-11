import type { SkillSummary } from "./skill.model";

// One developer as returned by GET /developers.
export interface Developer {
  uuid: string;
  name: string;
  email: string | null;
  division: string | null;
  designation: string | null;
  status: string; // "A" active, "I" inactive
  skills: SkillSummary[];
}
