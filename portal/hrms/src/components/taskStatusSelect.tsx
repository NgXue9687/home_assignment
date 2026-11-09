import { MenuItem, Select } from "@mui/material";
import {
  TASK_STATUS_LABELS,
  type TaskStatusCode,
} from "../shared/constants";

const STATUS_OPTIONS = Object.entries(TASK_STATUS_LABELS) as [TaskStatusCode, string][];

interface TaskStatusSelectProps {
  value: TaskStatusCode;
  disabled: boolean;
  onChange: (status: TaskStatusCode) => void;
}

// Status dropdown for one task. Saving happens in the page as soon as it changes.
export function TaskStatusSelect({ value, disabled, onChange }: TaskStatusSelectProps) {
  return (
    <Select
      size="small"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as TaskStatusCode)}
      sx={{ minWidth: 140, bgcolor: "background.paper" }}
      inputProps={{ "aria-label": "Status" }}
    >
      {STATUS_OPTIONS.map(([code, label]) => (
        <MenuItem key={code} value={code}>
          {label}
        </MenuItem>
      ))}
    </Select>
  );
}

export default TaskStatusSelect;
