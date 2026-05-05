import { PageShell } from "@/components/marketing/PageShell";

export const metadata = { title: "איך זה עובד · תשלם לי" };

const STEPS = [
  { n: "01", t: "שמטו את הכרטיס", b: "ה-AI מזהה תוך 1.5 שניות מספר טיסה, תאריך, ומסלול." },
  { n: "02", t: "אנחנו מאמתים את העיכוב", b: "מערכת מאגר טיסות גלובלי בודקת את האיחור או הביטול." },
  { n: "03", t: "מחשבון הזכאות מציג את הסכום", b: "EC 261 או חוק שירותי תעופה — אנחנו לוקחים את הגדול ביותר." },
  { n: "04", t: "עורך הדין שולח מכתב דרישה", b: "באנגלית פורמלית, מותאם לחברת התעופה הספציפית." },
  { n: "05", t: "הכסף נכנס לחשבון", b: "תוך 7-21 ימים. אם החברה מסרבת, אנחנו ממשיכים — בלי תשלום נוסף." },
];

export default function HowItWorks() {
  return (
    <PageShell eyebrow="02 · HOW" title="חמישה שלבים. שלוש דקות.">
      <ol className="space-y-10">
        {STEPS.map((s) => (
          <li key={s.n} className="grid grid-cols-12 gap-6 items-start">
            <span className="col-span-2 font-mono text-2xl text-reversal">{s.n}</span>
            <div className="col-span-10">
              <div className="font-heebo font-black text-fluorescent text-2xl">{s.t}</div>
              <div className="font-heebo text-fluorescent/65 mt-1">{s.b}</div>
            </div>
          </li>
        ))}
      </ol>
    </PageShell>
  );
}
