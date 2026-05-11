import { BarChart2 } from "lucide-react";
import AdminSubPage from "../_components/AdminSubPage";
import ComingSoon from "../_components/ComingSoon";

export default function VisitsPage() {
  return (
    <AdminSubPage
      label="Visitas"
      icon={BarChart2}
      gradient="bg-gradient-to-br from-cyan-500/80 to-teal-600/80"
    >
      <ComingSoon label="Visitas ao Website" />
    </AdminSubPage>
  );
}
