export type Plan = "free" | "pro";

export const PLAN_SERVICE_FEE_CENT: Record<Plan, number> = {
  free: 150,
  pro: 75,
};

export const PLAN_EVENT_LIMIT: Record<Plan, number | null> = {
  free: 3,
  pro: null,
};

export const PLAN_SEAT_LIMIT: Record<Plan, number | null> = {
  free: 80,
  pro: null,
};

export function effectivePlan(plan: string | null, aboBis: string | null): Plan {
  if (plan === "pro") {
    if (!aboBis) return "pro";
    return new Date(aboBis) > new Date() ? "pro" : "free";
  }
  return "free";
}
