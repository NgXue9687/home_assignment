import { createContext, useContext } from "react";

export type NoticeSeverity = "success" | "error" | "info";

// One line in the activity log.
export interface LogEntry {
  id: number;
  time: Date;
  severity: NoticeSeverity;
  message: string;
}

export interface NotificationApi {
  // Shows a toast and adds the message to the activity log.
  notify: (severity: NoticeSeverity, message: string) => void;
}

export const NotificationContext = createContext<NotificationApi | null>(null);

// const notify = useNotify(); notify("success", "Task saved");
export function useNotify(): NotificationApi["notify"] {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotify must be used inside <NotificationProvider>");
  }
  return context.notify;
}
