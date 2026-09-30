/** Map Postgres/PostgREST errors to something a person can act on. */
export function dbErrorMessage(error: { code?: string; message: string }): string {
  switch (error.code) {
    case "23503":
      return "That category isn't available any more. Pick another one.";
    case "23505":
      return "That already exists.";
    case "23514":
      return "Some values aren't allowed. Check the amount and text lengths.";
    case "42501":
      return "You don't have access to that.";
    default:
      console.error("DB error", error);
      return "Couldn't save. Please try again.";
  }
}

/** First Zod issue as a sentence. */
export function firstIssue(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Check the form and try again.";
}
