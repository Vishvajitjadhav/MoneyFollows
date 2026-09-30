import { z } from "zod";

export const transactionTypeSchema = z.enum(["EXPENSE", "INCOME", "INVESTMENT"]);

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date.");
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep it under ${max} characters.`)
    .transform((v) => (v === "" ? null : v))
    .nullish();

export const amountSchema = z.coerce
  .number({ error: "Enter an amount." })
  .positive("Amount must be more than ₹0.")
  .max(999_999_999, "That amount is too large.")
  .transform((v) => Math.round(v * 100) / 100);

export const transactionInputSchema = z.object({
  type: transactionTypeSchema,
  amount: amountSchema,
  categoryId: z.uuid("Pick a category."),
  subcategoryId: z.uuid().nullish(),
  date: isoDate,
  description: optionalText(200),
  notes: optionalText(1000),
  isPurchase: z.boolean().default(false),
  /** field_id → value; empty values are removed. */
  customFields: z.record(z.uuid(), z.union([z.string().max(500), z.number(), z.boolean(), z.null()])).default({}),
});

export type TransactionInput = z.input<typeof transactionInputSchema>;
export type TransactionData = z.output<typeof transactionInputSchema>;
