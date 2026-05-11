import { auth } from "@/lib/auth";
import { TrendingUp } from "lucide-react";
import AdminSubPage from "../../_components/AdminSubPage";
import TopProductsList from "../../_components/TopProductsList";

export default async function MostOrderedPage() {
  const session = await auth();
  return (
    <AdminSubPage
      label="Mais Comprados"
      icon={TrendingUp}
      gradient="bg-gradient-to-br from-violet-500/80 to-purple-600/80"
    >
      <TopProductsList
        userId={session!.user.id}
        endpoint="/admin/stats/most-ordered"
        emptyLabel="Sem dados suficientes"
      />
    </AdminSubPage>
  );
}
