import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { Alert, Snackbar } from "@mui/material";
import {
  NotificationContext,
  type LogEntry,
  type NoticeSeverity,
} from "./notificationContext";
import { ActivityLog } from "../../components/activityLog";

const MAX_LOG_ENTRIES = 100; // oldest entries are dropped after this
const TOAST_DURATION_MS = { success: 3000, info: 3000, error: 6000 };

// Wraps the app so any page can call useNotify(). Shows each message as a
// toast and keeps a history in the activity log (in memory: cleared on refresh).
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [toast, setToast] = useState<LogEntry | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [lastSeenId, setLastSeenId] = useState(0);
  const nextId = useRef(1);

  const notify = useCallback((severity: NoticeSeverity, message: string) => {
    const entry: LogEntry = { id: nextId.current++, time: new Date(), severity, message };
    setEntries((current) => [entry, ...current].slice(0, MAX_LOG_ENTRIES));
    setToast(entry);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  // Entries added since the log was last looked at.
  const unreadCount = logOpen ? 0 : entries.filter((entry) => entry.id > lastSeenId).length;

  const toggleLog = () => {
    setLogOpen((open) => !open);
    setLastSeenId(entries[0]?.id ?? 0); // opening or closing marks everything as seen
  };

  const closeToast = (_event?: unknown, reason?: string) => {
    if (reason === "clickaway") return; // clicking elsewhere on the page keeps it open
    setToast(null);
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}

      <Snackbar
        key={toast?.id} // a new message restarts the timer
        open={toast !== null}
        autoHideDuration={toast ? TOAST_DURATION_MS[toast.severity] : null}
        onClose={closeToast}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        {toast ? (
          <Alert severity={toast.severity} variant="filled" onClose={closeToast}>
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>

      <ActivityLog
        entries={entries}
        open={logOpen}
        unreadCount={unreadCount}
        onToggle={toggleLog}
        onClear={() => setEntries([])}
      />
    </NotificationContext.Provider>
  );
}

export default NotificationProvider;
