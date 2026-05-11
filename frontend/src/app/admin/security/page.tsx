import { ShieldCheck } from "lucide-react";
import AdminSubPage from "../_components/AdminSubPage";
import ComingSoon from "../_components/ComingSoon";

export default function SecurityPage() {
  return (
    <AdminSubPage
      label="Segurança"
      icon={ShieldCheck}
      gradient="bg-gradient-to-br from-red-500/80 to-rose-700/80"
    >
      <ComingSoon label="Segurança" />
    </AdminSubPage>
  );
}
