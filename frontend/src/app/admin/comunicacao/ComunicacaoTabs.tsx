"use client";

import { MessagesSquare, Newspaper, Headphones, MessageSquare, Users } from "lucide-react";
import AdminTabbedSubPage, { TabbedTab } from "../_components/AdminTabbedSubPage";
import NoticiasPanel from "./NoticiasPanel";
import SupportPanel from "./SupportPanel";
import SubscritoresPanel from "./SubscritoresPanel";
import ChatAdminClient from "../chat/ChatAdminClient";

interface Props {
  userId: string;
  userName: string;
  userEmail: string;
}

export default function ComunicacaoTabs({ userId, userName, userEmail }: Props) {
  const tabs: TabbedTab[] = [
    {
      key: "noticias",
      label: "Notícias",
      icon: Newspaper,
      content: <NoticiasPanel userId={userId} adminEmail={userEmail} />,
    },
    {
      key: "suporte",
      label: "Apoio ao Cliente",
      icon: Headphones,
      content: <SupportPanel userId={userId} />,
    },
    {
      key: "subscritores",
      label: "Subscritores",
      icon: Users,
      content: <SubscritoresPanel userId={userId} />,
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
