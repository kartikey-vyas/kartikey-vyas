import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ShareJoinCode } from "@/components/ShareJoinCode";

export function GroupHeader({
  groupName,
  joinCode,
  subtitle,
}: {
  groupName: string;
  joinCode: string;
  subtitle?: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3 safe-top">
        <div className="min-w-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Home
          </Link>
          <h1 className="truncate text-lg font-semibold leading-tight">{groupName}</h1>
          {subtitle && (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <ShareJoinCode joinCode={joinCode} groupName={groupName} />
      </div>
    </header>
  );
}
