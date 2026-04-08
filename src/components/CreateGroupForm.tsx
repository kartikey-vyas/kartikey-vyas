"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { COMMON_CURRENCIES } from "@/lib/validators";
import { createGroupAction, type ActionState } from "@/server/actions/groups";

export function CreateGroupForm() {
  const [state, formAction, pending] = useActionState<ActionState | null, FormData>(
    createGroupAction,
    null,
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Trip name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Bali 2026"
          required
          autoComplete="off"
          maxLength={60}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="baseCurrency">Base currency</Label>
        <NativeSelect id="baseCurrency" name="baseCurrency" defaultValue="AUD">
          {COMMON_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </NativeSelect>
        <p className="text-xs text-muted-foreground">
          Balances are shown in this currency. Individual expenses can still be in other currencies.
        </p>
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
        {pending ? "Creating…" : "Create trip"}
      </Button>
    </form>
  );
}
