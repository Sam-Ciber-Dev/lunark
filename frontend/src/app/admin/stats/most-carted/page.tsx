import { auth } from "@/lib/auth";
import { ShoppingCart } from "lucide-react";
import AdminSubPage from "../../_components/AdminSubPage";
import TopProductsList from "../../_components/TopProductsList";

export default async function MostCartedPage() {
  const session = await auth();
  return (
    <AdminSubPage
      label="Mais no Carrinho"
      icon={ShoppingCart}
      gradient="bg-gradient-to-br from-emerald-500/80 to-teal-600/80"
    >
      <TopProductsList
        userId={session!.user.id}
        endpoint="/admin/stats/most-carted"
        emptyLabel="Sem dados suficientes"
      />
    </AdminSubPage>
  );
}
