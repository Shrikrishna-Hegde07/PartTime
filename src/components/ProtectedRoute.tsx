import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, Role } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface Props {
  children: ReactNode;
  requiredRole?: Role;
}

export const ProtectedRoute = ({ children, requiredRole }: Props) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/auth?mode=signin&redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (requiredRole && role !== requiredRole && role !== "admin") {
    // Wrong role: send them to their correct landing
    return <Navigate to={role === "client" ? "/dashboard" : "/jobs"} replace />;
  }

  return <>{children}</>;
};
