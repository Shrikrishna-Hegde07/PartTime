import { Link, useLocation, useNavigate } from "react-router-dom";
import { Briefcase, LayoutDashboard, MapPin, User, Zap, LogOut, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navbar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();

  // Build links based on role
  const links =
    role === "client"
      ? [
          { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { to: "/jobs", label: "Browse", icon: Briefcase },
          { to: "/profile", label: "Profile", icon: User },
        ]
      : [
          { to: "/jobs", label: "Find Jobs", icon: Briefcase },
          { to: "/profile", label: "Profile", icon: User },
        ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="container flex h-16 items-center justify-between">
        <Link to={user ? (role === "client" ? "/dashboard" : "/jobs") : "/"} className="flex items-center gap-2">
          <div className="relative h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-elegant">
            <Zap className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="font-bold tracking-tight">Work Time</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Student Gigs
            </div>
          </div>
        </Link>

        {user && (
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => {
              const active = pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "px-4 py-2 text-sm rounded-lg transition-colors",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/60 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            Bengaluru
          </div>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="h-7 w-7 rounded-full bg-gradient-primary grid place-items-center text-xs font-bold text-primary-foreground">
                    {user.email?.[0].toUpperCase()}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-1.5 text-xs">
                  <div className="font-medium truncate">{user.email}</div>
                  <div className="text-muted-foreground capitalize">{role}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile"><User className="h-4 w-4" /> Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth?mode=signin"><LogIn className="h-4 w-4" /> Sign in</Link>
              </Button>
              <Button size="sm" className="bg-gradient-primary" asChild>
                <Link to="/auth?mode=signup">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      {user && (
        <nav className="md:hidden border-t border-border/60 bg-background/80">
          <div className="container grid" style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}>
            {links.map((l) => {
              const active = pathname === l.to;
              const Icon = l.icon;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[11px]",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {l.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
};
