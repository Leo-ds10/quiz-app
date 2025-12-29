import { Trophy, Medal, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { User, QuizAttempt } from "@/lib/db/schema";

interface LeaderboardEntry {
  rank: number;
  user: User;
  correctCount: number;
  totalQuestions: number;
  totalTimeMs: number;
  timedOut?: boolean;
}

interface QuizLeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export function QuizLeaderboard({ entries, currentUserId }: QuizLeaderboardProps) {
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="w-5 text-center text-muted-foreground">{rank}</span>;
    }
  };

  const getInitials = (user: User) => {
    return (
      user.displayName
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) ??
      user.name?.slice(0, 2).toUpperCase() ??
      "U"
    );
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No attempts yet. Be the first to play!
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">Rank</TableHead>
          <TableHead>Player</TableHead>
          <TableHead className="text-right">Score</TableHead>
          <TableHead className="text-right">Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => {
          const isCurrentUser = entry.user.id === currentUserId;
          return (
            <TableRow
              key={`${entry.user.id}-${entry.rank}`}
              className={isCurrentUser ? "bg-primary/5" : ""}
            >
              <TableCell>{getRankIcon(entry.rank)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={entry.user.image ?? undefined} />
                    <AvatarFallback>{getInitials(entry.user)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="font-medium">
                      {entry.user.displayName || entry.user.name}
                    </span>
                    {isCurrentUser && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <span className="font-medium">
                  {entry.correctCount}/{entry.totalQuestions}
                </span>
                <span className="text-muted-foreground ml-1">
                  ({Math.round((entry.correctCount / entry.totalQuestions) * 100)}%)
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {formatTime(entry.totalTimeMs)}
                  {entry.timedOut && (
                    <Badge variant="destructive" className="ml-1 text-xs">
                      Timeout
                    </Badge>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
