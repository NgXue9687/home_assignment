import {
  getSubtaskDepth,
  hasUnfinishedSubtasks,
} from '../../../src/shared/utils/tasks.utils.js';

describe('hasUnfinishedSubtasks', () => {
  it('is false when the task has no subtasks', () => {
    expect(hasUnfinishedSubtasks([])).toBe(false);
  });

  it('is false when every subtask is Done', () => {
    expect(hasUnfinishedSubtasks(['D', 'D'])).toBe(false);
  });

  it('is true when any subtask is To-do or In progress', () => {
    expect(hasUnfinishedSubtasks(['D', 'T'])).toBe(true);
    expect(hasUnfinishedSubtasks(['P'])).toBe(true);
  });
});

describe('getSubtaskDepth', () => {
  it('is 0 when the task has no subtasks', () => {
    expect(getSubtaskDepth({})).toBe(0);
    expect(getSubtaskDepth({ subtasks: [] })).toBe(0);
  });

  it('is 1 when the task only has direct subtasks', () => {
    expect(getSubtaskDepth({ subtasks: [{}, {}] })).toBe(1);
  });

  it('follows the deepest branch', () => {
    const task = {
      subtasks: [{}, { subtasks: [{ subtasks: [{}] }] }],
    };

    expect(getSubtaskDepth(task)).toBe(3);
  });
});
