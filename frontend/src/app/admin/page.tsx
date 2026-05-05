import { auth } from "@/lib/auth";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const session = await auth();
  return <AdminDashboard userId={session!.user.id} />;
}
