import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { BookOpen, Heart, Shield } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsAdmin } from "../hooks/useQueries";

export default function Header() {
  const { login, clear, identity, loginStatus } = useInternetIdentity();
  const { data: isAdmin } = useIsAdmin();

  return (
    <header className="relative z-20 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          data-ocid="nav.link"
          className="flex items-center gap-2 group"
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Heart className="w-4 h-4 text-primary fill-primary" />
          </div>
          <span className="font-display font-bold text-xl text-foreground tracking-tight">
            LoveReads
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-2">
          <Link to="/" data-ocid="nav.link">
            <Button variant="ghost" size="sm" className="gap-1.5 font-serif">
              <BookOpen className="w-4 h-4" />
              Store
            </Button>
          </Link>

          {isAdmin && (
            <Link to="/admin" data-ocid="nav.link">
              <Button variant="ghost" size="sm" className="gap-1.5 font-serif">
                <Shield className="w-4 h-4" />
                Admin
              </Button>
            </Link>
          )}

          {identity ? (
            <Button
              data-ocid="nav.secondary_button"
              variant="outline"
              size="sm"
              onClick={clear}
              className="font-serif"
            >
              Sign Out
            </Button>
          ) : (
            <Button
              data-ocid="nav.primary_button"
              size="sm"
              onClick={login}
              disabled={loginStatus === "logging-in"}
              className="bg-primary text-primary-foreground font-serif"
            >
              Sign In
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
