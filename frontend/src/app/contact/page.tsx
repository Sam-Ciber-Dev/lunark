"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Turnstile } from "@/components/Turnstile";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const onVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const onExpire = useCallback(() => {
    setTurnstileToken("");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    // In dev mode without Turnstile key, use a placeholder token
    const token = turnstileToken || "dev-token";

    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, turnstileToken: token }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Erro ao enviar mensagem");
      }

      setResult({ type: "success", text: "Mensagem enviada com sucesso!" });
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setTurnstileToken("");
    } catch (err) {
      setResult({
        type: "error",
        text: err instanceof Error ? err.message : "Erro ao enviar",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold">Contacto</h1>
      <p className="mb-8 text-muted-foreground">
        Tem alguma questão? Envia-nos uma mensagem.
      </p>

      {result && (
        <p
          className={`mb-4 rounded-md px-4 py-2 text-sm ${
            result.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {result.text}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome"
          required
          minLength={2}
          maxLength={100}
          className="rounded-md border bg-background px-4 py-2"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="rounded-md border bg-background px-4 py-2"
        />
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Assunto"
          required
          minLength={2}
          maxLength={200}
          className="rounded-md border bg-background px-4 py-2"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="Mensagem"
          required
          minLength={10}
          maxLength={2000}
          className="rounded-md border bg-background px-4 py-2"
        />

        <Turnstile onVerify={onVerify} onExpire={onExpire} />

        <Button type="submit" disabled={loading}>
          {loading ? "A enviar…" : "Enviar mensagem"}
        </Button>
      </form>
    </section>
  );
}
