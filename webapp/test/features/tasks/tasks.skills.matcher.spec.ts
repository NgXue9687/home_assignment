import { findMissingSkillIds } from '../../../src/shared/utils/tasks.skills.matcher.js';

describe('findMissingSkillIds', () => {
  it('returns an empty list when the developer has every required skill', () => {
    expect(findMissingSkillIds(['1', '2'], ['1', '2', '3'])).toEqual([]);
  });

  it('returns the required skills the developer lacks', () => {
    expect(findMissingSkillIds(['1', '2'], ['2'])).toEqual(['1']);
  });

  it('returns an empty list when the task requires no skills', () => {
    expect(findMissingSkillIds([], ['1'])).toEqual([]);
  });
});
