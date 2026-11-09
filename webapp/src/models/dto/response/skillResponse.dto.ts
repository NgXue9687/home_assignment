import { SkillEntity } from '../../entity/skill.entity.js';

export type SkillResponseDto = {
  uuid: string;
  skillName: string;
  skillDescription: string;
  status: string;
};

export function toSkillResponse(skill: SkillEntity): SkillResponseDto {
  return {
    uuid: skill.uuid,
    skillName: skill.skillName,
    skillDescription: skill.skillDescription,
    status: skill.status,
  };
}
