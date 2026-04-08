"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function GroupTabs({ joinCode }: { joinCode: string }) {
  const pathname = usePathname();
  const base = `/groups/${joinCode}`;
  const tabs = [
    { href: base, label: "Expenses" },
    { href: `${base}/balances`, label: "Balances" },
  ];
  return (
    <div className="mx-auto grid max-w-md grid-cols-2 gap-1 rounded-full bg-secondary p-1">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "rounded-full px-4 py-2 text-center text-sm font-medium transition",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
