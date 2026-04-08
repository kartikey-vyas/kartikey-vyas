"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { COMMON_CURRENCIES } from "@/lib/validators";
import {
  addExpenseAction,
  updateExpenseAction,
  deleteExpenseAction,
  type ExpenseActionState,
} from "@/server/actions/expenses";
import { Decimal } from "decimal.js";

type Member = { id: string; displayName: string };

type InitialExpense = {
  id: string;
  description: string;
  amount: string;
  currency: string;
  paidByMemberId: string;
  date: string; // YYYY-MM-DD
  splits: { memberId: string; shareAmount: string }[];
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function DialogFooterLocal({
  children,
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end " +
        (className ?? "")
      }
    >
      {children}
    </div>
  );
}

export function ExpenseForm({
  joinCode,
  members,
  currentMemberId,
  baseCurrency,
  initial,
}: {
  joinCode: string;
  members: Member[];
  currentMemberId: string;
  baseCurrency: string;
  initial?: InitialExpense;
}) {
  const isEdit = Boolean(initial);

  const boundAction = isEdit
    ? updateExpenseAction.bind(null, joinCode, initial!.id)
    : addExpenseAction.bind(null, joinCode);

  const [state, formAction, pending] = useActionState<
    ExpenseActionState | null,
    FormData
  >(boundAction, null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  const initialParticipants = useMemo(
    () =>
      initial
        ? new Set(initial.splits.map((s) => s.memberId))
        : new Set(members.map((m) => m.id)),
    [initial, members],
  );

  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [currency, setCurrency] = useState(initial?.currency ?? baseCurrency);
  const [paidBy, setPaidBy] = useState(
    initial?.paidByMemberId ?? currentMemberId,
  );
  const [participants, setParticipants] =
    useState<Set<string>>(initialParticipants);
  const [splitType, setSplitType] = useState<"equal" | "custom">("equal");
  const [customShares, setCustomShares] = useState<Record<string, string>>(
    () => {
      const base: Record<string, string> = {};
      if (initial) {
        for (const s of initial.splits) base[s.memberId] = s.shareAmount;
      }
      return base;
    },
  );

  // Detect whether the initial splits are actually equal. If not, start in
  // custom mode so existing uneven splits don't get silently normalised.
  useEffect(() => {
    if (!initial) return;
    const amt = new Decimal(initial.amount);
    const n = initial.splits.length;
    if (n === 0) return;
    const equal = amt.div(n).toDecimalPlaces(2);
    const allEqualish = initial.splits.every((s) =>
      new Decimal(s.shareAmount).minus(equal).abs().lte(0.01),
    );
    setSplitType(allEqualish ? "equal" : "custom");
  }, [initial]);

  const toggleParticipant = (id: string) => {
    setParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Compute the equal-split preview and the "remaining" helper for custom.
  const participantIds = members
    .map((m) => m.id)
    .filter((id) => participants.has(id));

  const equalPreview =
    amount && participantIds.length > 0
      ? new Decimal(amount || "0")
          .div(participantIds.length)
          .toDecimalPlaces(2)
          .toFixed(2)
      : null;

  const customSum = participantIds.reduce((acc, id) => {
    const v = customShares[id];
    if (!v) return acc;
    try {
      return acc.plus(new Decimal(v));
    } catch {
      return acc;
    }
  }, new Decimal(0));
  const customRemaining = amount
    ? new Decimal(amount || "0").minus(customSum).toDecimalPlaces(2)
    : null;

  return (
    <form action={formAction} className="space-y-5 pb-32">
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          placeholder="Dinner at the beach place"
          required
          autoComplete="off"
          maxLength={120}
          defaultValue={initial?.description}
        />
      </div>

      <div className="grid grid-cols-[1fr_110px] gap-3">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <NativeSelect
            id="currency"
            name="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {COMMON_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={initial?.date ?? todayIso()}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="paidByMemberId">Paid by</Label>
        <NativeSelect
          id="paidByMemberId"
          name="paidByMemberId"
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
          required
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName}
              {m.id === currentMemberId ? " (you)" : ""}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-2">
        <Label>Split between</Label>
        <div className="divide-y rounded-lg border">
          {members.map((m) => {
            const checked = participants.has(m.id);
            return (
              <div key={m.id} className="flex items-center gap-3 px-3 py-3">
                <Checkbox
                  id={`participant-${m.id}`}
                  checked={checked}
                  onCheckedChange={() => toggleParticipant(m.id)}
                />
                {checked && (
                  <input
                    type="hidden"
                    name="participantIds"
                    value={m.id}
                  />
                )}
                <label
                  htmlFor={`participant-${m.id}`}
                  className="flex-1 select-none text-sm font-medium"
                >
                  {m.displayName}
                  {m.id === currentMemberId && (
                    <span className="ml-1 text-muted-foreground">(you)</span>
                  )}
                </label>
                {splitType === "equal" && checked && equalPreview && (
                  <span className="text-xs text-muted-foreground">
                    {equalPreview}
                  </span>
                )}
                {splitType === "custom" && checked && (
                  <Input
                    name={`customShare[${m.id}]`}
                    inputMode="decimal"
                    placeholder="0.00"
                    className="h-9 w-24 text-right"
                    value={customShares[m.id] ?? ""}
                    onChange={(e) =>
                      setCustomShares((prev) => ({
                        ...prev,
                        [m.id]: e.target.value,
                      }))
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Split type</Label>
        <input type="hidden" name="splitType" value={splitType} />
        <RadioGroup
          value={splitType}
          onValueChange={(v) => setSplitType(v as "equal" | "custom")}
          className="grid grid-cols-2 gap-2"
        >
          <label
            className={
              "flex cursor-pointer items-center gap-3 rounded-lg border p-3 " +
              (splitType === "equal" ? "border-primary bg-primary/5" : "")
            }
          >
            <RadioGroupItem value="equal" id="split-equal" />
            <span className="text-sm font-medium">Equal</span>
          </label>
          <label
            className={
              "flex cursor-pointer items-center gap-3 rounded-lg border p-3 " +
              (splitType === "custom" ? "border-primary bg-primary/5" : "")
            }
          >
            <RadioGroupItem value="custom" id="split-custom" />
            <span className="text-sm font-medium">Custom amounts</span>
          </label>
        </RadioGroup>
        {splitType === "custom" && customRemaining !== null && (
          <p
            className={
              "text-xs " +
              (customRemaining.equals(0)
                ? "text-emerald-600"
                : "text-muted-foreground")
            }
          >
            {customRemaining.equals(0)
              ? "Shares add up perfectly."
              : `Remaining: ${customRemaining.toFixed(2)} ${currency}`}
          </p>
        )}
      </div>

      {/* Sticky submit bar on mobile */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur safe-bottom">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 pt-3">
          {isEdit && initial && (
            <DeleteExpenseButton joinCode={joinCode} expenseId={initial.id} />
          )}
          <Button
            type="submit"
            size="lg"
            className="flex-1"
            disabled={pending || participantIds.length === 0}
          >
            {pending ? "Saving…" : isEdit ? "Save changes" : "Add expense"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function DeleteExpenseButton({
  joinCode,
  expenseId,
}: {
  joinCode: string;
  expenseId: string;
}) {
  const boundAction = deleteExpenseAction.bind(null, joinCode, expenseId);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label="Delete expense"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this expense?</DialogTitle>
          <DialogDescription>
            This permanently removes the expense and its splits. Balances will update.
          </DialogDescription>
        </DialogHeader>
        <DialogFooterLocal>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="sm:flex-none">
              Cancel
            </Button>
          </DialogClose>
          <form action={boundAction}>
            <Button type="submit" variant="destructive" className="w-full sm:w-auto">
              Delete
            </Button>
          </form>
        </DialogFooterLocal>
      </DialogContent>
    </Dialog>
  );
}
