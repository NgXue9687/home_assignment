// src/routes.tsx
import { createBrowserRouter, Navigate } from "react-router";
import MainLayout from "./layouts/mainLayout";
import TaskListingPage from "./pages/taskListingPage";
import TaskCreatePage from "./pages/taskCreatePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />, // shared layout: top bar + <Outlet /> for the page
    children: [
      { index: true, element: <Navigate to="/tasks" replace /> },
      { path: "tasks", element: <TaskListingPage /> },
      { path: "tasks/create", element: <TaskCreatePage /> },
      // Any other URL (e.g. /task or /tasks/abc) goes to the task list.
      // "*" only matches when no other route does.
      { path: "*", element: <Navigate to="/tasks" replace /> },
    ],
  },
]);