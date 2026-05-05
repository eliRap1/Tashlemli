import { PageShell } from "@/components/marketing/PageShell";
import { Calculator } from "@/components/sections/Calculator";

export const metadata = { title: "תמחור · תשלם לי" };

export default function Pricing() {
  return (
    <PageShell eyebrow="03 · PRICING" title="22%. אם לא קיבלת — לא משלמים.">
      <p className="text-2xl font-heebo font-black text-reversal">המחיר היחיד הוא 22% עמלה מהסכום שתחזירי.</p>
      <ul className="font-mono text-base text-fluorescent/70 leading-[2]">
        <li>לא מקדימים תשלום.</li>
        <li>לא לוקחים אגרת תיק.</li>
        <li>לא חותמים אותך לחבילה חודשית.</li>
        <li>אם החברה מסרבת לשלם — את לא חבה לנו דבר.</li>
      </ul>
      <p className="text-fluorescent/65">
        לשם ההשוואה: AirHelp / Compensair / ClaimCompass — 35% עד 50%. הם פועלים בכל אירופה.
        אנחנו פועלים אך ורק בישראל. זו הסיבה שאנחנו זולים יותר ומהירים יותר.
      </p>
      <div className="my-12">
        <Calculator />
      </div>
    </PageShell>
  );
}
