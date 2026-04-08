import { redirect } from "next/navigation";
import { findGroupByCode } from "@/lib/auth";
import { getMemberIdForGroup } from "@/lib/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { JoinByCodeForm } from "@/components/JoinByCodeForm";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: raw } = await params;
  const code = raw.toUpperCase();
  const group = await findGroupByCode(code);
  if (!group) {
    redirect("/");
  }

  // Already a member? Go straight to the dashboard.
  const memberId = await getMemberIdForGroup(code);
  if (memberId && group.members.some((m) => m.id === memberId)) {
    redirect(`/groups/${code}`);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-10 pt-10 safe-top">
      <Card>
        <CardHeader>
          <CardTitle>Join {group.name}</CardTitle>
          <CardDescription>
            {group.members.length === 0
              ? "Be the first to join this trip."
              : `${group.members.length} ${
                  group.members.length === 1 ? "person is" : "people are"
                } already in this trip.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JoinByCodeForm joinCode={code} />
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Heads up: anyone with this join code can act as any member in the trip.
      </p>
    </main>
  );
}
