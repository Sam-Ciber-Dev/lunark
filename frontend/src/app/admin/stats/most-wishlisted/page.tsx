import { auth } from "@/lib/auth";
import { Heart } from "lucide-react";
import AdminSubPage from "../../_components/AdminSubPage";
import TopProductsList from "../../_components/TopProductsList";

export default async function MostWishlistedPage() {
  const session = await auth();
  return (
    <AdminSubPage
      label="Mais Desejados"
      icon={Heart}
      gradient="bg-gradient-to-br from-rose-500/80 to-pink-600/80"
    >
      <TopProductsList
        userId={session!.user.id}
        endpoint="/admin/stats/most-wishlisted"
        emptyLabel="Sem dados suficientes"
      />
    </AdminSubPage>
  );
}
