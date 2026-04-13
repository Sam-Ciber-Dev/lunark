import { auth } from "@/lib/auth";
import DashboardContent from "./DashboardContent";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface Stats {
  products: number;
  orders: number;
  users: number;
  categories: number;
}

async function getStats(userId: string): Promise<Stats> {
  try {
    const res = await fetch(`${API_URL}/admin/stats`, {
      headers: { "x-user-id": userId },
      cache: "no-store",
    });
    if (!res.ok) return { products: 0, orders: 0, users: 0, categories: 0 };
    return res.json();
  } catch {
    return { products: 0, orders: 0, users: 0, categories: 0 };
  }
}

export default async function AdminDashboard() {
  const session = await auth();
  const stats = await getStats(session!.user.id);

  return <DashboardContent stats={stats} />;
}
