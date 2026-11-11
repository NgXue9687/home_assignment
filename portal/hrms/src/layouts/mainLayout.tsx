import { Box, Container } from "@mui/material";
import { Outlet } from "react-router";
import { HeaderComponent } from "../components/headerComponent";
import { NotificationProvider } from "../shared/notifications/notificationProvider";
import { useAppDispatch } from "../store/hooks";
import { useEffect } from "react";
import { fetchSysConfigs } from "../store/sysConfigslice";

// Shared layout for every page: top bar + the current page underneath.
// NotificationProvider lets every page show toasts and write to the activity log.
export function MainLayout() {
  const dispatch = useAppDispatch();
useEffect(() => {
  dispatch(fetchSysConfigs());
}, [dispatch]);
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
