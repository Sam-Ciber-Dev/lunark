import { auth } from "@/lib/auth";
import AdminShell from "../../AdminShell";
import TopProductsList from "../../_components/TopProductsList";

export default async function MostWishlistedPage() {
  const session = await auth();
  return (
    <AdminShell userId={session!.user.id}>
      <TopProductsList
        userId={session!.user.id}
        endpoint="/admin/stats/most-wishlisted"
        emptyLabel="Sem dados suficientes"
      />
    </AdminShell>
  );
}
