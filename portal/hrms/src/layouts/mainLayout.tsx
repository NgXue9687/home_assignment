import { Box, Container } from "@mui/material";
import { Outlet } from "react-router";
import { HeaderComponent } from "../components/headerComponent";
import { NotificationProvider } from "../shared/notifications/notificationProvider";

// Shared layout for every page: top bar + the current page underneath.
// NotificationProvider lets every page show toasts and write to the activity log.
export function MainLayout() {
  return (
    <NotificationProvider>
      <Box sx={{ minHeight: "100vh", bgcolor: "grey.50" }}>
        <HeaderComponent />
        <Container component="main" sx={{ py: 4 }}>
          <Outlet />
        </Container>
      </Box>
    </NotificationProvider>
  );
}

export default MainLayout;
