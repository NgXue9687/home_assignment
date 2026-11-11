import {
  Autocomplete,
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { Skill, TaskStatusCode } from "../models";
import {
  MAX_SUBTASK_DEPTH,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_STATUS_LABELS,
  TASK_TITLE_MAX_LENGTH,
} from "../shared/constants";
import type { DraftErrors, TaskDraft } from "../shared/taskDraft";
import { useAppSelector } from "../store/hooks";
import { selectMaxSubtaskDepth } from "../store/sysConfigslice";

const STATUS_OPTIONS = Object.entries(TASK_STATUS_LABELS) as [TaskStatusCode, string][];

interface TaskFormCardProps {
  draft: TaskDraft;
  label: string; // "1", "1.1", "1.1.2"…
  depth: number; // 0 for the main task
  skills: Skill[];
  errors: Map<string, DraftErrors>;
  disabled: boolean;
  onChange: (key: string, changes: Partial<Omit<TaskDraft, "key" | "subtasks">>) => void;
  onAddSubtask: (parentKey: string) => void;
  onRemove: (key: string) => void;
}

// One task's fields, followed by its subtasks, each drawn by this same
// component one level further in. That is how any depth of nesting is shown.
export function TaskFormCard({
  draft,
  label,
  depth,
  skills,
  errors,
  disabled,
  onChange,
  onAddSubtask,
  onRemove,
}: TaskFormCardProps) {
  const maxDepth = useAppSelector(selectMaxSubtaskDepth);
  const cardErrors = errors.get(draft.key) ?? {};
  const isMainTask = depth === 0;
  const canAddSubtask = depth < maxDepth;
  const selectedSkills = skills.filter((skill) => draft.skillUuids.includes(skill.uuid));
  const heading = isMainTask ? `Task ${label}` : `Subtask ${label}`;

  return (
    <Box>
      <Paper
        variant="outlined"
        component="section"
        aria-label={heading}
        sx={{ p: 2, borderStyle: "dashed", borderWidth: 2 }}
      >
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}
        >
          <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
            {heading}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip
              title={canAddSubtask ? "" : `Subtasks can be nested at most ${MAX_SUBTASK_DEPTH} levels deep`}
            >
              {/* span: a tooltip needs an element that still gets mouse events when the button is disabled */}
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={disabled || !canAddSubtask}
                  onClick={() => onAddSubtask(draft.key)}
                >
                  Add Subtask
                </Button>
              </span>
            </Tooltip>
            {!isMainTask && (
              <Button
                size="small"
                color="error"
                disabled={disabled}
                onClick={() => onRemove(draft.key)}
                aria-label={`Delete subtask ${label}`}
              >
                Delete
              </Button>
            )}
          </Stack>
        </Stack>

        <Stack spacing={2}>
          <TextField
            label="Title"
            required
            fullWidth
            size="small"
            value={draft.taskTitle}
            disabled={disabled}
            onChange={(event) => onChange(draft.key, { taskTitle: event.target.value })}
            error={Boolean(cardErrors.taskTitle)}
            helperText={cardErrors.taskTitle}
            slotProps={{ htmlInput: { maxLength: TASK_TITLE_MAX_LENGTH } }}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            minRows={2}
            size="small"
            value={draft.taskDescription}
            disabled={disabled}
            onChange={(event) => onChange(draft.key, { taskDescription: event.target.value })}
            error={Boolean(cardErrors.taskDescription)}
            helperText={cardErrors.taskDescription}
            slotProps={{ htmlInput: { maxLength: TASK_DESCRIPTION_MAX_LENGTH } }}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              select
              label="Status"
              size="small"
              value={draft.status}
              disabled={disabled}
              onChange={(event) =>
                onChange(draft.key, { status: event.target.value as TaskStatusCode })
              }
              error={Boolean(cardErrors.status)}
              helperText={cardErrors.status}
              sx={{ minWidth: 180 }}
            >
              {STATUS_OPTIONS.map(([code, statusLabel]) => (
                <MenuItem key={code} value={code}>
                  {statusLabel}
                </MenuItem>
              ))}
            </TextField>
            <Autocomplete
              multiple
              fullWidth
              size="small"
              options={skills}
              value={selectedSkills}
              disabled={disabled}
              getOptionLabel={(skill) => skill.skillName}
              isOptionEqualToValue={(option, value) => option.uuid === value.uuid}
              onChange={(_event, chosen) =>
                onChange(draft.key, { skillUuids: chosen.map((skill) => skill.uuid) })
              }
              renderValue={(chosen, getItemProps) =>
                chosen.map((skill, index) => {
                  const { key, ...itemProps } = getItemProps({ index });
                  return <Chip key={key} label={skill.skillName} size="small" {...itemProps} />;
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Skills"
                  helperText="Leave empty to have the skills identified automatically"
                />
              )}
            />
          </Stack>
        </Stack>
      </Paper>

      {draft.subtasks.length > 0 && (
        <Stack
          spacing={2}
          sx={{ mt: 2, ml: { xs: 1, sm: 3 }, pl: { xs: 1, sm: 2 }, borderLeft: 2, borderColor: "divider" }}
        >
          {draft.subtasks.map((subtask, index) => (
            <TaskFormCard
              key={subtask.key}
              draft={subtask}
              label={`${label}.${index + 1}`}
              depth={depth + 1}
              skills={skills}
              errors={errors}
              disabled={disabled}
              onChange={onChange}
              onAddSubtask={onAddSubtask}
              onRemove={onRemove}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}

export default TaskFormCard;
