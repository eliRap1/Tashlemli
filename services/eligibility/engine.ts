import type { ComputeInput, ComputeResult } from "./types";

const EUR_TO_ILS = 4.37;
const IL_STATUTE_YEARS = 4;
const EU_STATUTE_YEARS_IL_COURT = 2;

function isOutOfStatute(flightDateIso: string, jurisdiction: ComputeInput["jurisdiction"]): boolean {
  const flight = new Date(flightDateIso + "T00:00:00Z").getTime();
  const now = Date.now();
  const years = (now - flight) / (1000 * 60 * 60 * 24 * 365.25);
  if (jurisdiction === "IL2012") return years > IL_STATUTE_YEARS;
  if (jurisdiction === "EU261") return years > EU_STATUTE_YEARS_IL_COURT;
  return years > IL_STATUTE_YEARS && years > EU_STATUTE_YEARS_IL_COURT;
}

function eu261(input: ComputeInput): ComputeResult {
  const { distance_km, delay_minutes, cancellation, reason_category } = input;
  if (reason_category === "extraordinary" || reason_category === "war_related") {
    return reject("extraordinary_circumstance", "EU261");
  }
  const meaningful = cancellation || delay_minutes >= 180;
  if (!meaningful) return reject("delay_too_short", "EU261");

  let eur = 0;
  let groundCode = "";
  if (distance_km < 1500) {
    eur = 250;
    groundCode = cancellation ? "EU 261 art.5+7(1)(a)" : "EU 261 art.7(1)(a)";
  } else if (distance_km < 3500) {
    eur = 400;
    groundCode = cancellation ? "EU 261 art.5+7(1)(b)" : "EU 261 art.7(1)(b)";
  } else {
    eur = 600;
    groundCode = cancellation ? "EU 261 art.5+7(1)(c)" : "EU 261 art.7(1)(c)";
  }
  if (!cancellation && distance_km >= 3500 && delay_minutes < 240) {
    eur = eur / 2;
    groundCode = "EU 261 art.7(2)(c)";
  }
  return {
    eligible: true,
    amount_ils: Math.round(eur * EUR_TO_ILS),
    grounds: [groundCode],
    confidence: 0.92,
    rationale_he: `על פי תקנה 261/2004 של האיחוד האירופי, מגיע פיצוי של €${eur}.`,
    rationale_en: `Under EC 261/2004 you are entitled to €${eur} compensation.`,
  };
}

function il2012(input: ComputeInput): ComputeResult {
  const { distance_km, delay_minutes, cancellation, reason_category } = input;

  if (reason_category === "extraordinary") {
    return reject("extraordinary_circumstance", "IL2012");
  }
  const meaningful = cancellation || delay_minutes >= 300;
  if (!meaningful) return reject("delay_too_short", "IL2012");

  let amount_ils = 0;
  if (distance_km < 1500) amount_ils = 1530;
  else if (distance_km < 3500) amount_ils = 2450;
  else amount_ils = 3670;

  const grounds = ["IL Aviation Services Law §6"];
  if (reason_category === "war_related") {
    grounds.push("IL case law: war is not extraordinary for IL carriers");
  }

  return {
    eligible: true,
    amount_ils,
    grounds,
    confidence: 0.93,
    rationale_he: `על פי חוק שירותי תעופה (פיצוי וסיוע) התשע״ב-2012, מגיע פיצוי של ₪${amount_ils.toLocaleString()}.`,
    rationale_en: `Under IL Aviation Services Law you are entitled to ₪${amount_ils.toLocaleString()}.`,
  };
}

function reject(reason: NonNullable<ComputeResult["rejection_reason"]>, _jur: string): ComputeResult {
  const messages: Record<string, [string, string]> = {
    out_of_statute: [`תקופת ההתיישנות חלפה (4 שנים לפי חוק ישראלי / 2 שנים לפי EU 261).`, `Out of statute of limitations (4 years under IL law / 2 years under EU 261).`],
    delay_too_short: [`העיכוב היה קצר מהסף הנדרש.`, `Delay below threshold.`],
    extraordinary_circumstance: [`האירוע סווג כנסיבה יוצאת דופן.`, `Classified as extraordinary circumstance.`],
    no_jurisdiction: [`לא נמצאה סמכות שיפוט.`, `No applicable jurisdiction.`],
  };
  return {
    eligible: false,
    amount_ils: 0,
    grounds: [],
    confidence: 0.95,
    rationale_he: messages[reason][0],
    rationale_en: messages[reason][1],
    rejection_reason: reason,
  };
}

export function compute(input: ComputeInput): ComputeResult {
  if (isOutOfStatute(input.flight_date, input.jurisdiction)) {
    return reject("out_of_statute", input.jurisdiction);
  }
  if (input.jurisdiction === "EU261") return eu261(input);
  if (input.jurisdiction === "IL2012") return il2012(input);
  const eu = eu261(input);
  const il = il2012(input);
  if (!eu.eligible && !il.eligible) return eu;
  if (!eu.eligible) return il;
  if (!il.eligible) return eu;
  return eu.amount_ils >= il.amount_ils ? eu : il;
}
