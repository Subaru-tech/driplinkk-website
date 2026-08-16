/** Formatters for the values spec §1.2 renders in monospace. */

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatDate(iso: string) {
  return dateFormatter.format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return dateTimeFormatter.format(new Date(iso));
}

export function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

export function formatCredits(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

/** Ledger amounts carry an explicit sign — spec §6.4. */
export function formatSignedCredits(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatCredits(Math.abs(value))}`;
}
