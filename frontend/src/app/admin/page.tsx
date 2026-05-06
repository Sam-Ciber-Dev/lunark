import { auth } from "@/lib/auth";
import AdminShell from "./AdminShell";

export default async function AdminPage() {
  const session = await auth();
  return (
    <AdminShell userId={session!.user.id}>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Seleciona uma das áreas acima para começar.
        </p>
      </div>
    </AdminShell>
  );
}
