import { z } from "zod";

// Common ISO 4217 currency codes supported by the currency picker. This is
// not exhaustive — users can pick any of these at group creation time.
export const COMMON_CURRENCIES = [
  "AUD",
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "INR",
  "SGD",
  "IDR",
  "THB",
  "NZD",
  "CAD",
  "CHF",
  "CNY",
  "HKD",
  "KRW",
  "MYR",
  "PHP",
  "TWD",
  "VND",
  "MXN",
  "BRL",
  "ZAR",
] as const;

const currencyCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Currency must be a 3-letter code");

const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(40, "Name must be 40 characters or less");

const joinCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z2-9]{6}$/, "Join code must be 6 characters");

const descriptionSchema = z
  .string()
  .trim()
  .min(1, "Description is required")
  .max(120, "Description must be 120 characters or less");

// Accept strings or numbers for amounts; Decimal parses both.
const amountSchema = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === "number" ? v.toString() : v.trim()))
  .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), "Amount must be a positive number with up to 2 decimals")
  .refine((v) => parseFloat(v) > 0, "Amount must be greater than zero");

export const createGroupSchema = z.object({
  name: z.string().trim().min(1, "Group name is required").max(60),
  baseCurrency: currencyCodeSchema,
  displayName: displayNameSchema,
});

export const joinGroupSchema = z.object({
  code: joinCodeSchema,
  displayName: displayNameSchema,
});

export const joinOnlySchema = z.object({
  displayName: displayNameSchema,
});

export const expenseInputSchema = z
  .object({
    description: descriptionSchema,
    amount: amountSchema,
    currency: currencyCodeSchema,
    paidByMemberId: z.string().min(1, "Payer is required"),
    participantIds: z
      .array(z.string().min(1))
      .min(1, "At least one participant is required"),
    splitType: z.enum(["equal", "custom"]),
    customShares: z.record(z.string(), amountSchema).optional(),
    date: z
      .string()
      .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date"),
  })
  .refine(
    (data) =>
      data.splitType === "equal" ||
      (data.customShares &&
        data.participantIds.every((id) => id in data.customShares!)),
    {
      message: "Custom split requires an amount for every participant",
      path: ["customShares"],
    },
  );

export type ExpenseInput = z.infer<typeof expenseInputSchema>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type JoinGroupInput = z.infer<typeof joinGroupSchema>;
