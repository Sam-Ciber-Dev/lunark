import { ShieldOff } from "lucide-react";

export const metadata = { title: "Acesso bloqueado" };

export default function BlockedPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <ShieldOff className="mb-4 h-12 w-12 text-red-400" />
      <h1 className="mb-2 text-2xl font-semibold">Acesso bloqueado</h1>
      <p className="text-sm text-zinc-400">
        Este dispositivo foi bloqueado pelo sistema de segurança. Se acreditas
        que se trata de um erro, contacta o suporte.
      </p>
    </div>
  );
}
