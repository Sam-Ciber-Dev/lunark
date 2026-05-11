import { auth } from "@/lib/auth";
import SegurancaTabs from "./SegurancaTabs";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const session = await auth();
  const userId = session!.user.id;
  return <SegurancaTabs userId={userId} />;
}

