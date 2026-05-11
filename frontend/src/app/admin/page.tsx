import { auth } from "@/lib/auth";
import AdminShell from "./AdminShell";

export default async function AdminPage() {
  const session = await auth();
  return <AdminShell userId={session!.user.id} />;
}
