import { PageShell } from "@/components/marketing/PageShell";

export const metadata = { title: "ביטולים בגלל המצב · תשלם לי" };

export default function War() {
  return (
    <PageShell eyebrow="04 · WAR" title="התבטלה לך טיסה בגלל המצב? יש לך זכויות.">
      <p>
        מאז אוקטובר 2023, אלפי טיסות מישראל בוטלו או נדחו בגלל ״נסיבות יוצאות דופן״. חברות התעופה הזרות
        מסרבות לפצות. <span className="text-reversal">חוק שירותי תעופה הישראלי 2012 חולק עליהן.</span>
      </p>
      <h2 className="font-heebo font-black text-3xl text-fluorescent pt-6">מה החוק אומר</h2>
      <p>
        בית המשפט הישראלי כבר פסק ביותר מתיק אחד שמלחמה אינה ״נסיבה יוצאת דופן״ עבור חברות תעופה ישראליות
        כשמדובר בטיסה שנקבעה מראש. הפסיקה דורשת פיצוי מלא, ללא תלות בסיבה.
      </p>
      <h2 className="font-heebo font-black text-3xl text-fluorescent pt-6">מה אנחנו עושים</h2>
      <ul className="font-mono text-base text-fluorescent/70 leading-[2]">
        <li>מזהים את החברה הספציפית והמסלול.</li>
        <li>מנסחים מכתב דרישה בעברית ובאנגלית עם פסיקה ישראלית.</li>
        <li>שולחים מכתב חוזר אחרי 14 יום אם אין תגובה.</li>
        <li>מגישים תביעה קטנה אם נדרש.</li>
      </ul>
      <p className="text-cancellation font-bold pt-6">חשוב: יש לך 4 שנים מתאריך הטיסה. תיקים ישנים יותר התיישנו.</p>
    </PageShell>
  );
}
