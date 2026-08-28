import { redirect } from "next/navigation";
import CatalogPage from "@/frontend/CatalogPage";
import { getAdminUser } from "@/backend/supabase/server";

export default async function AdminPanelPage() {
  const admin = await getAdminUser().catch(() => null);

  if (!admin) {
    redirect("/admin");
  }

  return <CatalogPage adminOnly />;
}