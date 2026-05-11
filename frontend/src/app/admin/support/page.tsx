import { Headphones } from "lucide-react";
import AdminSubPage from "../_components/AdminSubPage";
import ComingSoon from "../_components/ComingSoon";

export default function SupportPage() {
  return (
    <AdminSubPage
      label="Apoio ao Cliente"
      icon={Headphones}
      gradient="bg-gradient-to-br from-orange-500/80 to-amber-600/80"
    >
      <ComingSoon label="Apoio ao Cliente" />
    </AdminSubPage>
  );
}
