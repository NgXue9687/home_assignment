import { Button, Paper, Typography } from "@mui/material";
import { Link, useLocation } from "react-router";

// Shown for any URL that matches no route (the "*" route in routes.tsx).
export function NotFoundPage() {
  const { pathname } = useLocation();
  return (
    <Paper sx={{ p: 4, textAlign: "center" }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Page not found
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        There is no page at <code>{pathname}</code>.
      </Typography>
      <Button variant="contained" component={Link} to="/tasks">
        Back to tasks
      </Button>
    </Paper>
  );
}

export default NotFoundPage;
