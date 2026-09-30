/**
 * Money & date formatting shared by the app and PDF reports.
 * INR with Indian digit grouping: ₹1,00,000.
 */

const inrWhole = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const plain = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

export type FormatINROptions = {
  /** Prefix "+" for positive values (and keep "−" for negative). */
  signed?: boolean;
  /** Short form: ₹1.2K, ₹4.5L, ₹1.1Cr. */
  compact?: boolean;
  /** Force two decimals even for whole amounts. */
  paise?: boolean;
};

/** Formats a rupee amount. Shows paise only when the amount has them. */
export function formatINR(amount: number, options: FormatINROptions = {}): string {
  const { signed = false, compact = false, paise = false } = options;
  const abs = Math.abs(amount);

  let body: string;
  if (compact) {
    body = `₹${formatCompact(abs)}`;
  } else if (paise || !Number.isInteger(Math.round(abs * 100) / 100)) {
    body = inrPaise.format(abs);
  } else {
    body = inrWhole.format(abs);
  }

  if (amount < 0) return `−${body}`;
  if (signed && amount > 0) return `+${body}`;
  return body;
}

/** 1,250 → "1.3K", 4,50,000 → "4.5L", 1,20,00,000 → "1.2Cr". */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  const trim = (n: number) => n.toFixed(1).replace(/\.0$/, "");
  if (abs >= 1_00_00_000) return `${sign}${trim(abs / 1_00_00_000)}Cr`;
  if (abs >= 1_00_000) return `${sign}${trim(abs / 1_00_000)}L`;
  if (abs >= 1_000) return `${sign}${trim(abs / 1_000)}K`;
  return `${sign}${plain.format(abs)}`;
}

/** Plain Indian-grouped number without currency symbol (for inputs, CSV). */
export function formatNumber(value: number): string {
  return plain.format(value);
}

/** Percentage with no more than one decimal: 0.823 → "82.3%". */
export function formatPercent(ratio: number, digits = 0): string {
  return `${(ratio * 100).toFixed(digits).replace(/\.0+$/, "")}%`;
}
