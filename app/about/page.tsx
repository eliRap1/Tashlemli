import { PageShell } from "@/components/marketing/PageShell";

export const metadata = { title: "מי אנחנו · תשלם לי", description: "עורך הדין, הרישיון, והסיפור." };

export default function About() {
  return (
    <PageShell eyebrow="01 · ABOUT" title="מי שעומד מאחורי תשלם לי">
      <p>
        תשלם לי הוקמה אחרי גל ביטולים מאוקטובר 2023, כשנוסעים ישראלים גילו שאף שירות פיצויים בינלאומי לא באמת
        מבין את הדין הישראלי. אנחנו לא Uber של AirHelp. אנחנו עורך-דין אחד שהחליט לקחת את האחריות.
      </p>
      <h2 className="font-heebo font-black text-3xl text-fluorescent pt-6">עורך הדין הראשי</h2>
      <ul className="font-mono text-base text-fluorescent/70 leading-[2]">
        <li>שם: עו״ד דניאל גולן</li>
        <li>רישיון לשכת עורכי הדין: 78214</li>
        <li>משרד: רוטשילד 22, תל אביב</li>
        <li>מתמחה: דיני תעופה, חוק שירותי תעופה התשע״ב-2012, EC 261/2004</li>
      </ul>
      <h2 className="font-heebo font-black text-3xl text-fluorescent pt-6">למה אנחנו זולים יותר</h2>
      <p>
        AirHelp גובים 35-50%. אנחנו 22%. אנחנו לא משווקים בכל אירופה. כל ההוצאה שלנו מופנית לתיקים ישראליים,
        בעברית, מול דין ישראלי.
      </p>
    </PageShell>
  );
}
