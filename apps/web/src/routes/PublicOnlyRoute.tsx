import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuthStore } from "../features/auth/store";
import { homePathForRole } from "./homePathForRole";

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (isAuthenticated && user) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  return <>{children}</>;
}
