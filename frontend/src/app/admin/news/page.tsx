import { auth } from "@/lib/auth";
import AdminShell from "../AdminShell";
import ComingSoon from "../_components/ComingSoon";

export default async function NewsPage() {
  const session = await auth();
  return (
    <AdminShell userId={session!.user.id}>
      <ComingSoon label="Notícias" />
    </AdminShell>
  );
}
