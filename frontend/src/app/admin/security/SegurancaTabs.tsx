"use client";

import { ShieldCheck, LayoutDashboard, Activity, ScrollText, Ban, FileText } from "lucide-react";
import AdminTabbedSubPage, { TabbedTab } from "../_components/AdminTabbedSubPage";
import DashboardPanel from "./DashboardPanel";
import LogsPanel from "./LogsPanel";
import DetailedLogsPanel from "./DetailedLogsPanel";
import BlockedPanel from "./BlockedPanel";
import ReportsPanel from "./ReportsPanel";

interface Props {
  userId: string;
}

export default function SegurancaTabs({ userId }: Props) {
  const tabs: TabbedTab[] = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      content: <DashboardPanel userId={userId} />,
    },
    {
      key: "logs",
      label: "Logs",
      icon: Activity,
      content: <LogsPanel userId={userId} />,
    },
    {
      key: "detailed",
      label: "Logs Detalhados",
      icon: ScrollText,
      content: <DetailedLogsPanel userId={userId} />,
    },
    {
      key: "blocked",
      label: "Bloqueados",
      icon: Ban,
      content: <BlockedPanel userId={userId} />,
    },
    {
      key: "reports",
      label: "Relatórios",
      icon: FileText,
      content: <ReportsPanel userId={userId} />,
    },
  ];

  return (
    <AdminTabbedSubPage
      label="Painel de Segurança"
      icon={ShieldCheck}
      gradient="bg-gradient-to-br from-red-500/80 to-rose-700/80"
      tabs={tabs}
      bare
    />
  );
}
