export function findMissingSkillIds(
  requiredSkillIds: string[],
  developerSkillIds: string[],
): string[] {
  const owned = new Set(developerSkillIds);
  return requiredSkillIds.filter((skillId) => !owned.has(skillId));
}
