"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  joinGroupByCodeAction,
  type ActionState,
} from "@/server/actions/groups";

export function JoinByCodeForm({ joinCode }: { joinCode: string }) {
  const boundAction = joinGroupByCodeAction.bind(null, joinCode);
  const [state, formAction, pending] = useActionState<ActionState | null, FormData>(
    boundAction,
    null,
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="displayName">Your name</Label>
        <Input
          id="displayName"
          name="displayName"
          placeholder="Alex"
          required
          autoComplete="off"
          maxLength={40}
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          Pick how you want to show up in this trip.
        </p>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Joining…" : "Join trip"}
      </Button>
    </form>
  );
}
