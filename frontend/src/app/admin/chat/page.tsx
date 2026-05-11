import { auth } from "@/lib/auth";
import { MessageSquare } from "lucide-react";
import AdminSubPage from "../_components/AdminSubPage";
import ChatAdminClient from "./ChatAdminClient";

export default async function ChatAdminPage() {
  const session = await auth();
  return (
    <AdminSubPage
      label="Chat Admin"
      icon={MessageSquare}
      gradient="bg-gradient-to-br from-indigo-500/80 to-violet-600/80"
    >
      <ChatAdminClient userId={session!.user.id} />
    </AdminSubPage>
  );
}
