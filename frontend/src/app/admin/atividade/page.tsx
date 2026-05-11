import { auth } from "@/lib/auth";
import { Activity, Heart, ShoppingCart, TrendingUp } from "lucide-react";
import AdminTabbedSubPage, { TabbedTab } from "../_components/AdminTabbedSubPage";
import TopProductsList from "../_components/TopProductsList";

export default async function AtividadePage() {
  const session = await auth();
  const userId = session!.user.id;

  const tabs: TabbedTab[] = [
    {
      key: "carrinho",
      label: "Mais no Carrinho",
      icon: ShoppingCart,
      content: (
        <TopProductsList
          userId={userId}
          endpoint="/admin/stats/most-carted"
          emptyLabel="Sem dados suficientes"
        />
      ),
    },
    {
      key: "desejados",
      label: "Mais Desejados",
      icon: Heart,
      content: (
        <TopProductsList
          userId={userId}
          endpoint="/admin/stats/most-wishlisted"
          emptyLabel="Sem dados suficientes"
        />
      ),
    },
    {
      key: "comprados",
      label: "Mais Comprados",
      icon: TrendingUp,
      content: (
        <TopProductsList
          userId={userId}
          endpoint="/admin/stats/most-ordered"
          emptyLabel="Sem dados suficientes"
        />
      ),
    },
  ];

  return (
    <AdminTabbedSubPage
      label="Atividade"
      icon={Activity}
      gradient="bg-gradient-to-br from-emerald-500/80 to-teal-600/80"
      tabs={tabs}
    />
  );
}
