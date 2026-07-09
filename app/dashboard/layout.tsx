import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DashboardNavigation } from "@/components/layout/dashboard-navigation";
import { KonfigurationsWarnung } from "@/components/layout/konfigurations-warnung";
import { DemoBanner } from "@/components/layout/demo-banner";
import { LanguageProvider } from "@/components/i18n-provider";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { istDemo } from "@/lib/demo";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/anmelden");

  // Language priority: cookie > profile > de
  const jar = await cookies();
  const cookieLang = jar.get("dashboard_lang")?.value;
  let locale: Locale = "de";

  if (cookieLang && isLocale(cookieLang)) {
    locale = cookieLang;
  } else {
    const { data: profil } = await supabase
      .from("veranstalter_profile")
      .select("sprache")
      .eq("id", user.id)
      .single();
    if (profil?.sprache && isLocale(profil.sprache)) locale = profil.sprache as Locale;
  }

  const dict = await getDictionary(locale);

  return (
    <LanguageProvider dict={dict} locale={locale}>
      <div className="flex min-h-screen bg-background">
        <DashboardNavigation />
        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pt-20 pb-24 lg:pt-8 lg:pb-8">
            {!istDemo(user.id) && <KonfigurationsWarnung />}
            {istDemo(user.id) && <DemoBanner t={dict.demo} />}
            {children}
          </div>
        </main>
      </div>
    </LanguageProvider>
  );
}
