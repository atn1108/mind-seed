import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout route for /rooms — renders either rooms.index (lobby) or
// rooms.$roomId (inside a room). It must render <Outlet /> for children.
export const Route = createFileRoute("/rooms")({
  component: RoomsLayout,
});

function RoomsLayout() {
  return <Outlet />;
}
