import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminNavbar } from "@/components/AdminNavbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
