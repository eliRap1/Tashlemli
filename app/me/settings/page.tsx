import { requireUser } from "@/lib/auth/middleware";
import { PrivacyToggle } from "@/components/me/PrivacyToggle";

export default async function Settings() {
  const user = await requireUser();
  return (
    <main dir="rtl" className="min-h-screen bg-terminal text-fluorescent py-16 px-6">
      <div className="mx-auto max-w-[640px] space-y-10">
        <h1 className="font-heebo font-black text-4xl">הגדרות</h1>
        <PrivacyToggle initial={user.privacyMode as "public_default" | "anonymous"} />
      </div>
    </main>
  );
}
