import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { TaskFormCard } from "../components/taskFormCard";
import { skillApi, taskApi } from "../shared/api";
import { SKILL_ACTIVE_STATUS, type Skill } from "../shared/constants";
import { useNotify } from "../shared/notifications/notificationContext";
import {
  addSubtask,
  countDrafts,
  newTaskDraft,
  removeDraft,
  toCreateTaskRequest,
  updateDraft,
  validateDraftTree,
  type TaskDraft,
} from "../shared/taskDraft";

export function TaskCreatePage() {
  const navigate = useNavigate();
  const notify = useNotify();
  const [draft, setDraft] = useState<TaskDraft>(newTaskDraft);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Errors only show after the first Save, then update as the user types.
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    let cancelled = false;
    skillApi
      .list()
      .then((all) => {
        if (!cancelled) setSkills(all.filter((skill) => skill.status === SKILL_ACTIVE_STATUS));
      })
      .catch((error: Error) => {
        if (!cancelled) setSkillsError(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const errors = useMemo(() => validateDraftTree(draft), [draft]);
  const visibleErrors = showErrors ? errors : new Map();

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (errors.size > 0) {
      setShowErrors(true);
      notify("error", "Please fix the highlighted fields before saving.");
      return;
    }
    setSaving(true);
    try {
      const created = await taskApi.create(toCreateTaskRequest(draft));
      const subtaskCount = countDrafts(draft) - 1;
      const skillNames = created.skills.map((skill) => skill.skillName).join(", ");
      notify(
        "success",
        `Created "${created.taskTitle}"` +
          (subtaskCount > 0 ? ` with ${subtaskCount} subtask${subtaskCount > 1 ? "s" : ""}` : "") +
          (skillNames ? ` (skills: ${skillNames})` : ""),
      );
      navigate("/tasks");
    } catch (error) {
      notify("error", `Could not create the task: ${(error as Error).message}`);
      setSaving(false);
    }
  };

  return (
    <Box component="form" noValidate onSubmit={handleSave}>
      <Typography variant="h5" component="h1" gutterBottom>
        Create Task(s)
      </Typography>

      {skillsError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Could not load skills ({skillsError}). You can still save: skills will be identified
          automatically.
        </Alert>
      )}

      <TaskFormCard
        draft={draft}
        label="1"
        depth={0}
        skills={skills}
        errors={visibleErrors}
        disabled={saving}
        onChange={(key, changes) => setDraft((current) => updateDraft(current, key, changes))}
        onAddSubtask={(parentKey) => setDraft((current) => addSubtask(current, parentKey))}
        onRemove={(key) => setDraft((current) => removeDraft(current, key))}
      />

      <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", mt: 3 }}>
        <Button disabled={saving} onClick={() => navigate("/tasks")}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </Stack>
    </Box>
  );
}

export default TaskCreatePage;
