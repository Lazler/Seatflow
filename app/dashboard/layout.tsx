import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNavigation } from "@/components/layout/dashboard-navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/anmelden");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardNavigation />
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
