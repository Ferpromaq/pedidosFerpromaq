import { redirect } from "next/navigation";
import { createServerClientInstance } from "@/lib/supabaseServer";
import DashboardShell from "./DashboardShell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClientInstance();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
