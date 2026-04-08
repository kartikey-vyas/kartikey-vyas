import { redirect } from "next/navigation";
import { db } from "./db";
import { getMemberIdForGroup } from "./session";

export type GroupWithMembers = {
  id: string;
  name: string;
  baseCurrency: string;
  joinCode: string;
  members: { id: string; displayName: string }[];
};

/**
 * Loads a group by its join code. Returns null if it doesn't exist.
 * Used for join-page rendering and validation before auth.
 */
export async function findGroupByCode(
  joinCode: string,
): Promise<GroupWithMembers | null> {
  const group = await db.group.findUnique({
    where: { joinCode },
    include: {
      members: {
        select: { id: true, displayName: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  return group;
}

/**
 * Ensures the caller has a valid session membership for the given group.
 * Redirects to the join page if the group exists but the caller isn't a
 * member, or to "/" if the group doesn't exist.
 *
 * Returns the group + current member.
 */
export async function requireMember(joinCode: string): Promise<{
  group: GroupWithMembers;
  currentMemberId: string;
}> {
  const normalised = joinCode.toUpperCase();
  const group = await findGroupByCode(normalised);
  if (!group) {
    redirect("/");
  }

  const memberId = await getMemberIdForGroup(normalised);
  if (!memberId) {
    redirect(`/groups/${normalised}/join`);
  }

  // Verify the cookie's memberId actually belongs to this group.
  const isMember = group.members.some((m) => m.id === memberId);
  if (!isMember) {
    redirect(`/groups/${normalised}/join`);
  }

  return { group, currentMemberId: memberId };
}
