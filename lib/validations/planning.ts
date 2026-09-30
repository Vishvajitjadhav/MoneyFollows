import { z } from "zod";
import { amountSchema, transactionTypeSchema } from "./transaction";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date.");
const name = (max: number) => z.string().trim().min(1, "Give it a name.").max(max, `Keep it under ${max} characters.`);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullish();

export const budgetSchema = z.object({
  categoryId: z.uuid("Pick a category."),
  month: isoDate.refine((d) => d.endsWith("-01"), "Month must start on the 1st."),
  amount: amountSchema,
});

export const goalSchema = z.object({
  name: name(60),
  targetAmount: amountSchema,
  currentAmount: z.coerce.number().min(0, "Can't be negative.").max(999_999_999).default(0),
  targetDate: isoDate.nullish().or(z.literal("").transform(() => null)),
  icon: z.string().max(40).default("growth"),
  color: z.string().max(20).default("green"),
});

export const contributionSchema = z.object({
  id: z.uuid(),
  amount: z.coerce.number().refine((v) => v !== 0, "Enter an amount.").refine((v) => Math.abs(v) <= 999_999_999, "Too large."),
});

export const frequencySchema = z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);

export const recurringSchema = z
  .object({
    type: transactionTypeSchema,
    amount: amountSchema,
    categoryId: z.uuid("Pick a category."),
    subcategoryId: z.uuid().nullish(),
    description: optionalText(200),
    frequency: frequencySchema,
    startDate: isoDate,
    endDate: isoDate.nullish().or(z.literal("").transform(() => null)),
    isPurchase: z.boolean().default(false),
    investmentId: z.uuid().nullish(),
  })
  .refine((v) => !v.endDate || v.endDate >= v.startDate, { message: "End date must be after the start date.", path: ["endDate"] });

export const investmentSchema = z
  .object({
    name: name(80),
    type: z.enum(["SIP", "MUTUAL_FUND", "STOCKS", "PPF", "FD", "OTHER"]),
    amount: amountSchema,
    frequency: z.enum(["ONE_TIME", "DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
    startDate: isoDate,
    endDate: isoDate.nullish().or(z.literal("").transform(() => null)),
    notes: optionalText(1000),
    /** Also create a recurring INVESTMENT transaction so it shows up in totals automatically. */
    autoRecord: z.boolean().default(false),
  })
  .refine((v) => !v.endDate || v.endDate >= v.startDate, { message: "End date must be after the start date.", path: ["endDate"] });

const money = z.coerce.number().min(0).max(999_999_999).default(0);
const pct = z.coerce.number().int().min(0).max(100);

export const planSchema = z.object({
  month: isoDate.refine((d) => d.endsWith("-01")),
  monthlyIncome: money,
  inputs: z.object({ rent: money, emi: money, familySupport: money, investments: money, goals: money }),
  allocations: z.object({ needs: pct, family: pct, investments: pct, savings: pct, lifestyle: pct, flexible: pct }),
});

export const categorySchema = z.object({
  name: name(40),
  type: transactionTypeSchema,
  icon: z.string().max(40).default("other"),
  color: z.string().max(20).default("slate"),
});

export const subcategorySchema = z.object({ categoryId: z.uuid(), name: name(40) });

export const customFieldSchema = z.object({
  name: name(40),
  fieldType: z.enum(["TEXT", "NUMBER", "DROPDOWN", "BOOLEAN", "DATE"]),
  options: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
});

export const profileSchema = z.object({ fullName: name(80) });
