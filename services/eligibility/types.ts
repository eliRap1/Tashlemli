import { z } from "zod";

export const ExtractedSchema = z.object({
  flight_number: z.string().regex(/^[A-Z]{2,3}\s?\d{1,4}$/),
  departure_date: z.string().date(),
  origin_iata: z.string().length(3),
  destination_iata: z.string().length(3),
  passenger_name: z.string().nullable(),
  booking_ref: z.string().nullable(),
  airline_name: z.string().nullable(),
  delay_minutes_from_doc: z.number().nullable(),
  incident_hint: z.enum(["cancellation", "delay", "denied_boarding", "rerouted", "unknown"]),
  confidence: z.number().min(0).max(1),
});
export type Extracted = z.infer<typeof ExtractedSchema>;

export type ComputeInput = {
  distance_km: number;
  delay_minutes: number;
  cancellation: boolean;
  jurisdiction: "EU261" | "IL2012" | "BOTH";
  reason_category: "carrier_fault" | "extraordinary" | "war_related" | "unknown";
  flight_date: string;
};

export type ComputeResult = {
  eligible: boolean;
  amount_ils: number;
  grounds: string[];
  confidence: number;
  rationale_he: string;
  rationale_en: string;
  rejection_reason?:
    | "out_of_statute"
    | "delay_too_short"
    | "extraordinary_circumstance"
    | "no_jurisdiction";
};

export type JobEvent =
  | { kind: "queued" }
  | { kind: "extracting" }
  | { kind: "extracted"; extracted: Extracted }
  | { kind: "looking_up" }
  | { kind: "looked_up"; flight_id: string }
  | { kind: "computing" }
  | { kind: "ready"; result: ComputeResult; passenger: string; flight: string; route: string }
  | { kind: "failed"; code: string; message: string };
