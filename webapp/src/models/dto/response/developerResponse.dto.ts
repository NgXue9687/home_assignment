import { DeveloperEntity } from '../../entity/developer.entity.js';

export type DeveloperResponseDto = {
  uuid: string;
  name: string;
  email: string | null;
  division: string | null;
  designation: string | null;
  status: string;
  skills: { uuid: string; skillName: string }[];
};

export function toDeveloperResponse(
  developer: DeveloperEntity,
): DeveloperResponseDto {
  return {
    uuid: developer.uuid,
    name: developer.name,
    email: developer.email,
    division: developer.division,
    designation: developer.designation,
    status: developer.status,
    skills: (developer.developerSkillMappers ?? []).map((mapper) => ({
      uuid: mapper.skill.uuid,
      skillName: mapper.skill.skillName,
    })),
  };
}
