import { auth } from "@/lib/auth";
import AtividadeTabs from "./AtividadeTabs";

export default async function AtividadePage() {
  const session = await auth();
  const userId = session!.user.id;

  return <AtividadeTabs userId={userId} />;
}

