import type { ComputeInput, ComputeResult } from "./types";

type Case = {
  name: string;
  input: ComputeInput;
  expected: Pick<ComputeResult, "eligible"> &
    Partial<Pick<ComputeResult, "amount_ils" | "grounds" | "rejection_reason">>;
};

const recent = "2026-04-01";
const old = "2020-01-01";
// 3 years ago: EU261 is expired (>2y) but IL2012 is still in statute (<4y)
const threeYearsAgo = "2023-09-06";

export const FIXTURES: Case[] = [
  { name: "EU261 short-haul (<1500km) delay 4h → €250", input: { distance_km: 800, delay_minutes: 240, cancellation: false, jurisdiction: "EU261", reason_category: "carrier_fault", flight_date: recent }, expected: { eligible: true, amount_ils: 1093, grounds: ["EU 261 art.7(1)(a)"] } },
  { name: "EU261 mid-haul (1500-3500km) delay 3h → €400", input: { distance_km: 2400, delay_minutes: 200, cancellation: false, jurisdiction: "EU261", reason_category: "carrier_fault", flight_date: recent }, expected: { eligible: true, amount_ils: 1748, grounds: ["EU 261 art.7(1)(b)"] } },
  { name: "EU261 long-haul (>3500km) delay 4h → €600", input: { distance_km: 6000, delay_minutes: 250, cancellation: false, jurisdiction: "EU261", reason_category: "carrier_fault", flight_date: recent }, expected: { eligible: true, amount_ils: 2622, grounds: ["EU 261 art.7(1)(c)"] } },
  { name: "EU261 long-haul delay 3h-4h → 50% of €600", input: { distance_km: 6000, delay_minutes: 200, cancellation: false, jurisdiction: "EU261", reason_category: "carrier_fault", flight_date: recent }, expected: { eligible: true, amount_ils: 1311, grounds: ["EU 261 art.7(2)(c)"] } },
  { name: "EU261 short delay <3h → not eligible", input: { distance_km: 800, delay_minutes: 150, cancellation: false, jurisdiction: "EU261", reason_category: "carrier_fault", flight_date: recent }, expected: { eligible: false, rejection_reason: "delay_too_short" } },
  { name: "EU261 cancellation short-haul → €250", input: { distance_km: 800, delay_minutes: 0, cancellation: true, jurisdiction: "EU261", reason_category: "carrier_fault", flight_date: recent }, expected: { eligible: true, amount_ils: 1093, grounds: ["EU 261 art.5+7(1)(a)"] } },
  { name: "EU261 extraordinary circumstance → not eligible", input: { distance_km: 2400, delay_minutes: 250, cancellation: false, jurisdiction: "EU261", reason_category: "extraordinary", flight_date: recent }, expected: { eligible: false, rejection_reason: "extraordinary_circumstance" } },
  { name: "IL2012 short-haul delay 5h → ₪1530", input: { distance_km: 800, delay_minutes: 300, cancellation: false, jurisdiction: "IL2012", reason_category: "carrier_fault", flight_date: recent }, expected: { eligible: true, amount_ils: 1530, grounds: ["IL Aviation Services Law §6"] } },
  { name: "IL2012 mid-haul delay 5h → ₪2450", input: { distance_km: 2400, delay_minutes: 300, cancellation: false, jurisdiction: "IL2012", reason_category: "carrier_fault", flight_date: recent }, expected: { eligible: true, amount_ils: 2450, grounds: ["IL Aviation Services Law §6"] } },
  { name: "IL2012 long-haul delay 8h → ₪3670", input: { distance_km: 6000, delay_minutes: 480, cancellation: false, jurisdiction: "IL2012", reason_category: "carrier_fault", flight_date: recent }, expected: { eligible: true, amount_ils: 3670, grounds: ["IL Aviation Services Law §6"] } },
  { name: "IL2012 cancellation < 14d → ₪3670 long-haul", input: { distance_km: 6000, delay_minutes: 0, cancellation: true, jurisdiction: "IL2012", reason_category: "carrier_fault", flight_date: recent }, expected: { eligible: true, amount_ils: 3670, grounds: ["IL Aviation Services Law §6"] } },
  { name: "IL2012 war_related delay 6h → eligible (overrides extraordinary)", input: { distance_km: 2400, delay_minutes: 360, cancellation: false, jurisdiction: "IL2012", reason_category: "war_related", flight_date: recent }, expected: { eligible: true, amount_ils: 2450, grounds: ["IL Aviation Services Law §6", "IL case law: war is not extraordinary for IL carriers"] } },
  { name: "EU261 war_related → still extraordinary, not eligible", input: { distance_km: 2400, delay_minutes: 360, cancellation: false, jurisdiction: "EU261", reason_category: "war_related", flight_date: recent }, expected: { eligible: false, rejection_reason: "extraordinary_circumstance" } },
  { name: "BOTH picks higher amount (EU long > IL mid)", input: { distance_km: 6000, delay_minutes: 250, cancellation: false, jurisdiction: "BOTH", reason_category: "carrier_fault", flight_date: recent }, expected: { eligible: true, amount_ils: 2622, grounds: ["EU 261 art.7(1)(c)"] } },
  { name: "IL2012 old flight → out of statute", input: { distance_km: 2400, delay_minutes: 360, cancellation: false, jurisdiction: "IL2012", reason_category: "carrier_fault", flight_date: old }, expected: { eligible: false, rejection_reason: "out_of_statute" } },
  { name: "EU261 old flight (>2y) → out of statute (varies, IL court 2y)", input: { distance_km: 2400, delay_minutes: 360, cancellation: false, jurisdiction: "EU261", reason_category: "carrier_fault", flight_date: old }, expected: { eligible: false, rejection_reason: "out_of_statute" } },
  { name: "IL2012 cancellation short-haul → ₪1530", input: { distance_km: 800, delay_minutes: 0, cancellation: true, jurisdiction: "IL2012", reason_category: "carrier_fault", flight_date: recent }, expected: { eligible: true, amount_ils: 1530, grounds: ["IL Aviation Services Law §6"] } },
  { name: "IL2012 reason=unknown delay 6h → eligible", input: { distance_km: 1500, delay_minutes: 360, cancellation: false, jurisdiction: "IL2012", reason_category: "unknown", flight_date: recent }, expected: { eligible: true, amount_ils: 2450, grounds: ["IL Aviation Services Law §6"] } },
  { name: "EU261 boundary 1499km mid-haul rules apply for short", input: { distance_km: 1499, delay_minutes: 240, cancellation: false, jurisdiction: "EU261", reason_category: "carrier_fault", flight_date: recent }, expected: { eligible: true, amount_ils: 1093, grounds: ["EU 261 art.7(1)(a)"] } },
  { name: "EU261 boundary 1500km mid-haul rules apply for mid", input: { distance_km: 1500, delay_minutes: 200, cancellation: false, jurisdiction: "EU261", reason_category: "carrier_fault", flight_date: recent }, expected: { eligible: true, amount_ils: 1748, grounds: ["EU 261 art.7(1)(b)"] } },
  // EU261 statute (2y) has run; IL2012 (4y) is still valid → must return IL2012 result only
  { name: "BOTH flight 3yr old: EU261 expired, IL2012 still valid → IL2012 result", input: { distance_km: 6000, delay_minutes: 480, cancellation: false, jurisdiction: "BOTH", reason_category: "carrier_fault", flight_date: threeYearsAgo }, expected: { eligible: true, amount_ils: 3670, grounds: ["IL Aviation Services Law §6"] } },
];
