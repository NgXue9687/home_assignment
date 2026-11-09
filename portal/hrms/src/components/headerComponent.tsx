import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { NavLink } from "react-router";

// Links in the top bar. NavLink adds the "active" class to the current page's link.
const NAV_ITEMS = [
  { label: "Tasks", to: "/tasks", end: true },
  { label: "Create Task", to: "/tasks/create", end: false },
];

export function HeaderComponent(){
return(
    <>
     <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            HTX Task Manager
          </Typography>
          {NAV_ITEMS.map((item) => (
            <Button
              key={item.to}
              component={NavLink}
              to={item.to}
              end={item.end}
              color="inherit"
              sx={{
                opacity: 0.8,
                "&.active": { opacity: 1, borderBottom: "2px solid currentColor", borderRadius: 0 },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Toolbar>
      </AppBar>
      </>
)
}
     