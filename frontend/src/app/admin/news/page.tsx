import { Newspaper } from "lucide-react";
import AdminSubPage from "../_components/AdminSubPage";
import ComingSoon from "../_components/ComingSoon";

export default function NewsPage() {
  return (
    <AdminSubPage
      label="Notícias"
      icon={Newspaper}
      gradient="bg-gradient-to-br from-sky-500/80 to-blue-600/80"
    >
      <ComingSoon label="Notícias" />
    </AdminSubPage>
  );
}
