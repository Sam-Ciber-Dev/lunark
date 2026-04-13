import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Order } from "@/types/product";
import OrdersContent from "./OrdersContent";

export const metadata: Metadata = { title: "Orders" };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let orders: Order[] = [];
  try {
    const res = await fetch(`${API_URL}/orders`, {
      headers: { "x-user-id": session.user.id },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      orders = data.data ?? [];
    }
  } catch {}

  return <OrdersContent orders={orders} />;
}
