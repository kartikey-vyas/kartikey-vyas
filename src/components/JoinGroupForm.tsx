"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { joinGroupAction, type ActionState } from "@/server/actions/groups";

export function JoinGroupForm() {
  const [state, formAction, pending] = useActionState<ActionState | null, FormData>(
    joinGroupAction,
    null,
  );
  const [code, setCode] = useState("");

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="code">Join code</Label>
        <Input
          id="code"
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
          placeholder="ABC234"
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          className="text-center text-2xl tracking-[0.4em] font-mono uppercase"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="displayName">Your name</Label>
        <Input
          id="displayName"
          name="displayName"
          placeholder="Alex"
          required
          autoComplete="off"
          maxLength={40}
        />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Joining…" : "Join trip"}
      </Button>
    </form>
  );
}
