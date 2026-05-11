import { redirect } from "next/navigation";

export default function MostOrderedRedirect() {
  redirect("/admin/atividade?tab=comprados");
}
