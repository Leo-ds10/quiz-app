import Link from "next/link";
import { headers } from "next/headers";
import { Brain, Swords, Trophy } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { UserButton } from "@/components/auth/user-button";
import { auth } from "@/lib/auth/server";
import { canManageQuizzes } from "@/lib/auth/permissions";

export async function Header() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isAdmin = session?.user ? canManageQuizzes(session.user) : false;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Brain className="h-6 w-6" />
            <span className="font-bold">Quiz App</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/"
              className="flex items-center gap-1 transition-colors hover:text-foreground/80 text-foreground/60"
            >
              <Swords className="h-4 w-4" />
              Quizzes
            </Link>
            <Link
              href="/leaderboard"
              className="flex items-center gap-1 transition-colors hover:text-foreground/80 text-foreground/60"
            >
              <Trophy className="h-4 w-4" />
              Leaderboard
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <ThemeToggle />
          <UserButton isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
}
