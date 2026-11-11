// One skill as returned by GET /skills.
export interface Skill {
  uuid: string;
  skillName: string;
  skillDescription: string;
  status: string; // "A" active, "I" inactive
}

// The short form of a skill that tasks and developers carry.
export type SkillSummary = Pick<Skill, "uuid" | "skillName">;
