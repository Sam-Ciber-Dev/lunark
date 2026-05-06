import { auth } from "@/lib/auth";
import AdminShell from "../AdminShell";
import ChatAdminClient from "./ChatAdminClient";

export default async function ChatAdminPage() {
  const session = await auth();
  return (
    <AdminShell userId={session!.user.id}>
      <ChatAdminClient userId={session!.user.id} />
    </AdminShell>
  );
}
