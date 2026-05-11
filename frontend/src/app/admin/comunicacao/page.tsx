import { auth } from "@/lib/auth";
import { MessagesSquare, Newspaper, Headphones, MessageSquare } from "lucide-react";
import AdminTabbedSubPage, { TabbedTab } from "../_components/AdminTabbedSubPage";
import NoticiasPanel from "./NoticiasPanel";
import SupportPanel from "./SupportPanel";
import ChatAdminClient from "../chat/ChatAdminClient";

export default async function ComunicacaoPage() {
  const session = await auth();
  const userId = session!.user.id;
  const userName = session!.user.name ?? "Eu";

  const tabs: TabbedTab[] = [
    {
      key: "noticias",
      label: "Notícias",
      icon: Newspaper,
      content: <NoticiasPanel />,
    },
    {
      key: "suporte",
      label: "Apoio ao Cliente",
      icon: Headphones,
      content: <SupportPanel />,
    },
    {
      key: "chat",
      label: "Chat Interno",
      icon: MessageSquare,
      content: <ChatAdminClient userId={userId} userName={userName} embedded />,
    },
  ];

  return (
    <AdminTabbedSubPage
      label="Comunicação"
      icon={MessagesSquare}
      gradient="bg-gradient-to-br from-sky-500/80 to-blue-600/80"
      tabs={tabs}
      bare
    />
  );
}
