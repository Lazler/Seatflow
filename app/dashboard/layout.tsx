import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DashboardNavigation } from "@/components/layout/dashboard-navigation";
import { KonfigurationsWarnung } from "@/components/layout/konfigurations-warnung";
import { DemoBanner } from "@/components/layout/demo-banner";
import { LanguageProvider } from "@/components/i18n-provider";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { istDemo } from "@/lib/demo";
import { effectivePlan } from "@/lib/plan";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profil } = await supabase
    .from("veranstalter_profile")
    .select("sprache, name, plan, abo_bis")
    .eq("id", user.id)
    .single();

  // Language priority: cookie > profile > de
  const jar = await cookies();
  const cookieLang = jar.get("dashboard_lang")?.value;
  let locale: Locale = "de";

  if (cookieLang && isLocale(cookieLang)) {
    locale = cookieLang;
  } else if (profil?.sprache && isLocale(profil.sprache)) {
    locale = profil.sprache as Locale;
  }

  const dict = await getDictionary(locale);
  const plan = effectivePlan(profil?.plan ?? null, profil?.abo_bis ?? null);

  return (
    <LanguageProvider dict={dict} locale={locale}>
      <div className="flex min-h-screen bg-background">
        <DashboardNavigation
          orgName={profil?.name ?? undefined}
          userEmail={user.email ?? undefined}
          planLabel={plan === "pro" ? "Pro" : "Free"}
        />
        <main className="flex-1 overflow-auto">
          <div className="max-w-[1180px] px-4 sm:px-6 py-6 pt-20 pb-24 lg:px-12 lg:pt-10 lg:pb-12">
            {!istDemo(user.id) && <KonfigurationsWarnung t={dict.konfigWarnung} />}
            {istDemo(user.id) && <DemoBanner t={dict.demo} />}
            {children}
          </div>
        </main>
      </div>
    </LanguageProvider>
  );
}
