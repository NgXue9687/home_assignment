import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  styled,
  Table,
  TableBody,
  TableCell,
  tableCellClasses,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import type { Developer, SortOrder, Task, TaskColumnId, TaskStatusCode } from "../models";
import {
  DEFAULT_TASK_SORT,
  TASK_COLUMNS,
  TASK_STATUS_LABELS,
} from "../shared/constants";
import { sortTasks } from "../shared/taskSort";
import { developerApi, taskApi } from "../shared/api";
import { TaskStatusSelect } from "../components/taskStatusSelect";
import { TaskAssigneeSelect } from "../components/taskAssigneeSelect";
import { ConfirmDialog } from "../components/confirmDialog";
import { useNotify } from "../shared/notifications/notificationContext";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

// Keeps the sort label readable (white) on the black header, including when active.
const HeaderSortLabel = styled(TableSortLabel)(({ theme }) => ({
  color: theme.palette.common.white,
  "&:hover, &:focus, &.Mui-active": { color: theme.palette.common.white },
  "&.Mui-active .MuiTableSortLabel-icon": { color: theme.palette.common.white },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

// Short form of a title for messages, e.g. "As a visitor, I want to see a…"
function shortTitle(task: Task): string {
  return task.taskTitle.length > 40 ? `${task.taskTitle.slice(0, 40).trimEnd()}…` : task.taskTitle;
}

// Everything a cell needs besides the task itself.
interface CellContext {
  developers: Developer[];
  parentTitle: string | null; // set when the task is a subtask
  saving: boolean;
  onStatusChange: (task: Task, status: TaskStatusCode) => void;
  onAssigneeChange: (task: Task, developer: Developer | null) => void;
}

// e.g. "12 Nov 2026, 3:45 pm" in the viewer's own time zone and format.
function formatDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// What each column shows for one task.
function renderCell(task: Task, columnId: TaskColumnId, context: CellContext) {
  switch (columnId) {
    case "taskTitle":
      return (
        <>
          {task.taskTitle}
          {context.parentTitle && (
            <Typography variant="caption" color="text.secondary" component="div">
              Subtask of: {context.parentTitle}
            </Typography>
          )}
        </>
      );
    case "skills":
      return task.skills.length > 0 ? (
        <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: "wrap" }}>
          {task.skills.map((skill) => (
            <Chip key={skill.uuid} label={skill.skillName} size="small" variant="outlined" />
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          None
        </Typography>
      );
    case "status":
      return (
        <TaskStatusSelect
          value={task.status}
          disabled={context.saving}
          onChange={(status) => context.onStatusChange(task, status)}
        />
      );
    case "createdDate":
      return (
        <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
          {formatDateTime(task.createdDate)}
        </Typography>
      );
    case "assignedDeveloper":
      return (
        <TaskAssigneeSelect
          task={task}
          developers={context.developers}
          disabled={context.saving}
          onChange={(developer) => context.onAssigneeChange(task, developer)}
        />
      );
  }
}

// The Delete button for one row. Disabled while the task has subtasks, with a
// tooltip saying why (a disabled button gets no mouse events, hence the span).
function DeleteTaskButton({
  subtaskCount,
  disabled,
  onClick,
}: {
  subtaskCount: number;
  disabled: boolean;
  onClick: () => void;
}) {
  const hasSubtasks = subtaskCount > 0;
  return (
    <Tooltip
      title={
        hasSubtasks
          ? `Delete its ${subtaskCount} subtask${subtaskCount > 1 ? "s" : ""} first`
          : ""
      }
    >
      <span>
        <Button
          size="small"
          color="error"
          disabled={disabled || hasSubtasks}
          onClick={onClick}
        >
          Delete
        </Button>
      </span>
    </Tooltip>
  );
}

export function TaskListingPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [savingUuids, setSavingUuids] = useState<Set<string>>(new Set());
  const notify = useNotify();
  const [sort, setSort] = useState(DEFAULT_TASK_SORT);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load tasks and developers when the page opens (and on Retry).
  useEffect(() => {
    let cancelled = false;
    Promise.all([taskApi.list(), developerApi.list()])
      .then(([taskPage, developerList]) => {
        if (cancelled) return;
        setTasks(taskPage.items);
        setTotalTasks(taskPage.total);
        setDevelopers(developerList);
        setLoadError(null);
      })
      .catch((error: Error) => {
        if (!cancelled) setLoadError(error.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true; // the page closed or reloaded before the answer came back
    };
  }, [reloadCount]);

  const retry = () => {
    setLoading(true);
    setLoadError(null);
    setReloadCount((count) => count + 1);
  };

  const sortedTasks = useMemo(() => {
    const column = TASK_COLUMNS.find((c) => c.id === sort.orderBy) ?? TASK_COLUMNS[0];
    return sortTasks(tasks, column, sort.order);
  }, [tasks, sort]);

  const titlesByUuid = useMemo(
    () => new Map(tasks.map((task) => [task.uuid, task.taskTitle])),
    [tasks],
  );

  // How many subtasks each task has. A task with subtasks can't be deleted
  // (the backend refuses), so its Delete button is disabled.
  const subtaskCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const task of tasks) {
      if (task.parentUuid) counts.set(task.parentUuid, (counts.get(task.parentUuid) ?? 0) + 1);
    }
    return counts;
  }, [tasks]);

  // Clicking the sorted column flips the direction; clicking another column sorts it A→Z.
  const handleSort = (columnId: TaskColumnId) => {
    const order: SortOrder =
      sort.orderBy === columnId && sort.order === "asc" ? "desc" : "asc";
    setSort({ orderBy: columnId, order });
  };

  const replaceTask = (updated: Task) =>
    setTasks((current) => current.map((task) => (task.uuid === updated.uuid ? updated : task)));

  // Shows the change straight away, saves it, then keeps what the server
  // returns. If saving fails, the row goes back to how it was.
  const saveChange = async (
    original: Task,
    preview: Task,
    save: () => Promise<Task>,
    successMessage: string,
  ) => {
    replaceTask(preview);
    setSavingUuids((current) => new Set(current).add(original.uuid));
    try {
      replaceTask(await save());
      notify("success", successMessage);
    } catch (error) {
      replaceTask(original);
      notify("error", `Could not update "${shortTitle(original)}": ${(error as Error).message}`);
    } finally {
      setSavingUuids((current) => {
        const next = new Set(current);
        next.delete(original.uuid);
        return next;
      });
    }
  };

  const handleStatusChange = (task: Task, status: TaskStatusCode) => {
    if (status === task.status) return;
    void saveChange(
      task,
      { ...task, status },
      () => taskApi.changeStatus(task.uuid, status),
      `"${shortTitle(task)}": status changed to ${TASK_STATUS_LABELS[status]}`,
    );
  };

  const handleAssigneeChange = (task: Task, developer: Developer | null) => {
    if ((developer?.uuid ?? null) === (task.assignedDeveloper?.uuid ?? null)) return;
    void saveChange(
      task,
      {
        ...task,
        assignedDeveloper: developer && { uuid: developer.uuid, name: developer.name },
      },
      () => taskApi.assignDeveloper(task.uuid, developer?.uuid ?? null),
      developer
        ? `"${shortTitle(task)}": assigned to ${developer.name}`
        : `"${shortTitle(task)}": assignee removed`,
    );
  };

  // Runs after the user confirms in the dialog.
  const handleDelete = async () => {
    if (!taskToDelete) return;
    const task = taskToDelete;
    setDeleting(true);
    try {
      await taskApi.remove(task.uuid);
      setTasks((current) => current.filter((t) => t.uuid !== task.uuid));
      setTotalTasks((total) => total - 1);
      notify("success", `"${shortTitle(task)}": deleted`);
    } catch (error) {
      notify("error", `Could not delete "${shortTitle(task)}": ${(error as Error).message}`);
    } finally {
      setDeleting(false);
      setTaskToDelete(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress aria-label="Loading tasks" />
      </Box>
    );
  }

  if (loadError) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={retry}>
            Retry
          </Button>
        }
      >
        Could not load tasks: {loadError}
      </Alert>
    );
  }

  return (
    <>
      <Typography variant="h5" component="h1" gutterBottom>
        Tasks
      </Typography>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 700 }} aria-label="Tasks">
          <TableHead>
            <TableRow>
              {TASK_COLUMNS.map((column) => {
                const isActive = sort.orderBy === column.id;
                return (
                  <StyledTableCell
                    key={column.id}
                    sortDirection={isActive ? sort.order : false}
                  >
                    <HeaderSortLabel
                      active={isActive}
                      direction={isActive ? sort.order : "asc"}
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                      {isActive && (
                        <Box component="span" sx={visuallyHidden}>
                          {sort.order === "desc" ? "sorted descending" : "sorted ascending"}
                        </Box>
                      )}
                    </HeaderSortLabel>
                  </StyledTableCell>
                );
              })}
              <StyledTableCell align="right">Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedTasks.map((task) => {
              const context: CellContext = {
                developers,
                parentTitle: task.parentUuid ? (titlesByUuid.get(task.parentUuid) ?? null) : null,
                saving: savingUuids.has(task.uuid),
                onStatusChange: handleStatusChange,
                onAssigneeChange: handleAssigneeChange,
              };
              return (
                <StyledTableRow key={task.uuid}>
                  {TASK_COLUMNS.map((column, index) => (
                    <StyledTableCell
                      key={column.id}
                      // the first cell is the row header, for screen readers
                      {...(index === 0 && { component: "th", scope: "row" })}
                    >
                      {renderCell(task, column.id, context)}
                    </StyledTableCell>
                  ))}
                  <StyledTableCell align="right">
                    <DeleteTaskButton
                      subtaskCount={subtaskCounts.get(task.uuid) ?? 0}
                      disabled={context.saving}
                      onClick={() => setTaskToDelete(task)}
                    />
                  </StyledTableCell>
                </StyledTableRow>
              );
            })}
            {sortedTasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={TASK_COLUMNS.length + 1} align="center">
                  No available tasks yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalTasks > tasks.length && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          Showing the first {tasks.length} of {totalTasks} tasks.
        </Typography>
      )}

      <ConfirmDialog
        open={taskToDelete !== null}
        title="Delete task?"
        message={
          taskToDelete && (
            <>
              <strong>{taskToDelete.taskTitle}</strong> will be removed from the task list.
            </>
          )
        }
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setTaskToDelete(null)}
      />
    </>
  );
}

export default TaskListingPage;
