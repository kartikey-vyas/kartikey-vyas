"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { generateJoinCode } from "@/lib/codes";
import { setMembership, clearMembership } from "@/lib/session";
import {
  createGroupSchema,
  joinGroupSchema,
  joinOnlySchema,
} from "@/lib/validators";

export type ActionState = {
  ok: boolean;
  error?: string;
};

/**
 * Creates a new group with a unique join code, makes the caller the first
 * member, sets the session cookie, and redirects to the new group page.
 */
export async function createGroupAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createGroupSchema.safeParse({
    name: formData.get("name"),
    baseCurrency: formData.get("baseCurrency"),
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Very rare collision risk with a 30^6 alphabet (~7e8); retry on conflict.
  let joinCode = generateJoinCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await db.group.findUnique({ where: { joinCode } });
    if (!existing) break;
    joinCode = generateJoinCode();
  }

  const group = await db.group.create({
    data: {
      name: parsed.data.name,
      baseCurrency: parsed.data.baseCurrency,
      joinCode,
      members: {
        create: { displayName: parsed.data.displayName },
      },
    },
    include: { members: true },
  });

  await setMembership(group.joinCode, group.members[0].id);
  revalidatePath(`/groups/${group.joinCode}`);
  redirect(`/groups/${group.joinCode}`);
}

/**
 * Joins an existing group by code. Creates a new Member and sets the
 * session cookie.
 */
export async function joinGroupAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const parsed = joinGroupSchema.safeParse({
    code: formData.get("code"),
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const group = await db.group.findUnique({
    where: { joinCode: parsed.data.code },
  });
  if (!group) {
    return { ok: false, error: "No group found for that code" };
  }

  const member = await db.member.create({
    data: { groupId: group.id, displayName: parsed.data.displayName },
  });

  await setMembership(group.joinCode, member.id);
  revalidatePath(`/groups/${group.joinCode}`);
  redirect(`/groups/${group.joinCode}`);
}

/**
 * Joins a group when the code is already known from the URL (share flow).
 */
export async function joinGroupByCodeAction(
  joinCode: string,
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const code = joinCode.toUpperCase();
  const parsed = joinOnlySchema.safeParse({
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const group = await db.group.findUnique({ where: { joinCode: code } });
  if (!group) {
    return { ok: false, error: "Group not found" };
  }

  const member = await db.member.create({
    data: { groupId: group.id, displayName: parsed.data.displayName },
  });

  await setMembership(code, member.id);
  revalidatePath(`/groups/${code}`);
  redirect(`/groups/${code}`);
}

/**
 * Removes membership for a group from the caller's session cookie.
 * Does not delete the Member row (their share history stays intact).
 */
export async function leaveGroupAction(joinCode: string): Promise<void> {
  await clearMembership(joinCode.toUpperCase());
  redirect("/");
}
