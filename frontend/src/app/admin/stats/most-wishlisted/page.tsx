import { redirect } from "next/navigation";

export default function MostWishlistedRedirect() {
  redirect("/admin/atividade?tab=desejados");
}
