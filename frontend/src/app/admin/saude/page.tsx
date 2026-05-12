import { auth } from "@/lib/auth";
import HealthMonitorClient from "./HealthMonitorClient";

export const dynamic = "force-dynamic";

export default async function HealthMonitorPage() {
  const session = await auth();
  const userId = session!.user.id;
  return <HealthMonitorClient userId={userId} />;
}
