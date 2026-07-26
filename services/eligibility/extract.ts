import { generateObject } from "ai";
import { anthropic, HAIKU } from "@/lib/ai/gateway";
import { ExtractedSchema, type Extracted } from "./types";
import { AppError } from "@/lib/errors";

const SYSTEM = `You are a strict OCR + structured-data extractor for Israeli flight-disruption claims.
Read the boarding pass / booking confirmation image. Extract ONLY what is visible.
If a field is not visible, return null.
Use ISO date format YYYY-MM-DD.
flight_number must be IATA code + digits like "LY 381" or "U2 8123".
incident_hint inference: if image shows "CANCELED" stamp → "cancellation"; if delay number printed → "delay"; "REROUTED" → "rerouted"; "DENIED BOARDING" → "denied_boarding"; otherwise "unknown".
Compute confidence 0.0-1.0 based on legibility.`;

export async function extractFromImage(imageBytes: Buffer, contentType: string): Promise<Extracted> {
  // The AI SDK uses different content block shapes for raster images vs PDFs.
  // Passing a PDF buffer with type:"image" causes the provider to reject it.
  const docPart =
    contentType === "application/pdf"
      ? ({ type: "file" as const, data: imageBytes, mediaType: "application/pdf" as const })
      : ({ type: "image" as const, image: imageBytes, mediaType: contentType as "image/jpeg" | "image/png" | "image/webp" | "image/heic" | "image/heif" });

  const { object } = await generateObject({
    model: anthropic(HAIKU),
    schema: ExtractedSchema,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Extract the flight document fields." },
          docPart,
        ],
      },
    ],
    maxRetries: 2,
  });
  if (object.confidence < 0.6) {
    throw new AppError("EXTRACT_LOW_CONFIDENCE", `EXTRACT_LOW_CONFIDENCE: confidence ${object.confidence} below 0.6`, 422);
  }
  return object;
}
