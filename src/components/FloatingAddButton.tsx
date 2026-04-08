import Link from "next/link";
import { Plus } from "lucide-react";

export function FloatingAddButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      aria-label="Add expense"
      className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-95"
    >
      <Plus className="h-5 w-5" />
      <span className="text-sm font-semibold">Add expense</span>
    </Link>
  );
}
