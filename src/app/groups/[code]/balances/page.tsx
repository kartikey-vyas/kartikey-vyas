import { requireMember } from "@/lib/auth";
import { computeBalances } from "@/lib/balances";
import { GroupHeader } from "@/components/GroupHeader";
import { GroupTabs } from "@/components/GroupTabs";
import { BalancesSummary } from "@/components/BalancesSummary";
import { FloatingAddButton } from "@/components/FloatingAddButton";

export default async function BalancesPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: raw } = await params;
  const code = raw.toUpperCase();
  const { group, currentMemberId } = await requireMember(code);

  const result = await computeBalances(group.id);

  return (
    <div className="min-h-dvh pb-28">
      <GroupHeader
        groupName={group.name}
        joinCode={code}
        subtitle={`Base currency: ${group.baseCurrency}`}
      />
      <main className="mx-auto max-w-md px-4 py-5">
        <div className="mb-4">
          <GroupTabs joinCode={code} />
        </div>
        <BalancesSummary result={result} currentMemberId={currentMemberId} />
      </main>
      <FloatingAddButton href={`/groups/${code}/expenses/new`} />
    </div>
  );
}
