import { notFound } from "next/navigation";
import { findGroupByCode } from "@/lib/auth";

// This layout exists only to normalise/validate the join code. Member
// auth is enforced per-page (dashboard, add-expense, balances) via
// requireMember, because the join page itself is a public sub-route.

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const normalised = code.toUpperCase();
  if (code !== normalised) {
    // Minor normalisation — the underlying pages will handle the canonical
    // URL via links. Still render children so the join flow works.
  }
  const group = await findGroupByCode(normalised);
  if (!group) {
    notFound();
  }
  return <>{children}</>;
}
