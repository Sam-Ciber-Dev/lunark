import { auth } from "@/lib/auth";
import ChatAdminClient from "./ChatAdminClient";

// Full-screen chat layout: bypass AdminSubPage wrapper so the chat occupies
// the whole content area below the admin navbar (matches EyeWeb-style design).
export default async function ChatAdminPage() {
  const session = await auth();
  return <ChatAdminClient userId={session!.user.id} userName={session!.user.name ?? "Eu"} />;
}
