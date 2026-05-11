import { redirect } from "next/navigation";

export default function MostCartedRedirect() {
  redirect("/admin/atividade?tab=carrinho");
}
