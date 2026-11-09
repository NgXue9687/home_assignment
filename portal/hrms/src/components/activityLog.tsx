import {
  Badge,
  Box,
  Button,
  Collapse,
  Divider,
  Fab,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { LogEntry, NoticeSeverity } from "../shared/notifications/notificationContext";

const DOT_COLORS: Record<NoticeSeverity, string> = {
  success: "success.main",
  error: "error.main",
  info: "info.main",
};

interface ActivityLogProps {
  entries: LogEntry[]; // newest first
  open: boolean;
  unreadCount: number;
  onToggle: () => void;
  onClear: () => void;
}

// A floating panel in the bottom-right corner listing every update made in
// this session. The button shows how many arrived while it was hidden.
export function ActivityLog({ entries, open, unreadCount, onToggle, onClear }: ActivityLogProps) {
  return (
    <Stack
      spacing={1}
      sx={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: (theme) => theme.zIndex.snackbar - 1,
        alignItems: "flex-end",
      }}
    >
      <Collapse in={open} unmountOnExit>
        <Paper
          elevation={6}
          id="activity-log"
          role="log"
          aria-label="Activity log"
          sx={{ width: "min(380px, calc(100vw - 32px))" }}
        >
          <Stack
            direction="row"
            sx={{ alignItems: "center", justifyContent: "space-between", px: 2, py: 1 }}
          >
            <Typography variant="subtitle2">Activity log</Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" onClick={onClear} disabled={entries.length === 0}>
                Clear
              </Button>
              <Button size="small" onClick={onToggle}>
                Hide
              </Button>
            </Stack>
          </Stack>
          <Divider />
          <Box sx={{ maxHeight: 320, overflowY: "auto" }}>
            {entries.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                No updates yet. Changes you make will show here.
              </Typography>
            ) : (
              <List dense disablePadding>
                {entries.map((entry) => (
                  <ListItem key={entry.id} alignItems="flex-start" divider>
                    <Box
                      aria-label={entry.severity}
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: DOT_COLORS[entry.severity],
                        mt: 1,
                        mr: 1.5,
                        flexShrink: 0,
                      }}
                    />
                    <ListItemText
                      primary={entry.message}
                      secondary={entry.time.toLocaleTimeString()}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Paper>
      </Collapse>

      <Badge badgeContent={unreadCount} color="error" max={99}>
        <Fab
          variant="extended"
          size="medium"
          color="primary"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls="activity-log"
        >
          {open ? "Hide activity" : "Activity log"}
        </Fab>
      </Badge>
    </Stack>
  );
}

export default ActivityLog;
