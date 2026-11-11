import { ListSubheader, MenuItem, Select } from "@mui/material";
import type { Developer, Task } from "../models";
import { eligibleDevelopers } from "../shared/taskAssignment";

const UNASSIGNED = "";

interface TaskAssigneeSelectProps {
  task: Task;
  developers: Developer[];
  disabled: boolean;
  // null removes the current assignee
  onChange: (developer: Developer | null) => void;
}

// Assignee dropdown for one task. Only developers with every skill the task
// needs are offered, because the backend rejects anyone else.
export function TaskAssigneeSelect({
  task,
  developers,
  disabled,
  onChange,
}: TaskAssigneeSelectProps) {
  const options = eligibleDevelopers(task, developers);
  const current = task.assignedDeveloper;
  
  // Keep the current assignee selectable even if they no longer qualify
  const currentIsMissing =
    current !== null && !options.some((developer) => developer.uuid === current.uuid);

  return (
    <Select
      size="small"
      displayEmpty
      value={current?.uuid ?? UNASSIGNED}
      disabled={disabled}
      onChange={(event) => {
        const uuid = event.target.value;
        onChange(developers.find((developer) => developer.uuid === uuid) ?? null);
      }}
      sx={{ minWidth: 160, bgcolor: "background.paper" }}
      inputProps={{ "aria-label": "Assignee" }}
    >
      <MenuItem value={UNASSIGNED}>
        <em>Unassigned</em>
      </MenuItem>
      {currentIsMissing && (
        <MenuItem value={current.uuid} disabled>
          {current.name} (no longer eligible)
        </MenuItem>
      )}
      {options.map((developer) => (
        <MenuItem key={developer.uuid} value={developer.uuid}>
          {developer.name}
        </MenuItem>
      ))}
      {options.length === 0 && (
        <ListSubheader>No developer has all the required skills</ListSubheader>
      )}
    </Select>
  );
}

export default TaskAssigneeSelect;
