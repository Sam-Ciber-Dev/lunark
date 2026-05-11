import { auth } from "@/lib/auth";
import ComunicacaoTabs from "./ComunicacaoTabs";

export default async function ComunicacaoPage() {
  const session = await auth();
  const userId = session!.user.id;
  const userName = session!.user.name ?? "Eu";

  return <ComunicacaoTabs userId={userId} userName={userName} />;
}

