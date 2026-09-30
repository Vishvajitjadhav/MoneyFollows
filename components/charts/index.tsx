"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const loading = (h: string) => {
  const ChartSkeleton = () => <Skeleton className={`${h} w-full rounded-xl`} />;
  return ChartSkeleton;
};

// Recharts is ~100 KB — load it only when a chart is on screen, never on the server.
export const IncomeExpenseChart = dynamic(() => import("./charts").then((m) => m.IncomeExpenseChart), {
  ssr: false,
  loading: loading("h-64"),
});
export const SpendingTrendChart = dynamic(() => import("./charts").then((m) => m.SpendingTrendChart), {
  ssr: false,
  loading: loading("h-52"),
});
export const DailySpendingChart = dynamic(() => import("./charts").then((m) => m.DailySpendingChart), {
  ssr: false,
  loading: loading("h-48"),
});
