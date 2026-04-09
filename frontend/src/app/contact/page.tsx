"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Turnstile } from "@/components/Turnstile";
import { useI18n } from "@/lib/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function ContactPage() {
  const { t } = useI18n();
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

    const token = turnstileToken || "dev-token";

    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, turnstileToken: token }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? t.common.error);
      }

      setResult({ type: "success", text: t.contact.success });
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setTurnstileToken("");
    } catch (err) {
      setResult({
        type: "error",
        text: err instanceof Error ? err.message : t.common.error,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-4 text-3xl font-bold tracking-tight">{t.contact.title}</h1>
      <p className="mb-8 text-muted-foreground">{t.contact.subtitle}</p>

      {result && (
        <p
          className={`mb-4 rounded-md px-4 py-2 text-sm ${
            result.type === "success"
              ? "bg-green-500/10 text-green-500"
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
          placeholder={t.contact.name}
          required
          minLength={2}
          maxLength={100}
          className="rounded-md border border-border/40 bg-card px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.contact.email}
          required
          className="rounded-md border border-border/40 bg-card px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={t.contact.subject}
          required
          minLength={2}
          maxLength={200}
          className="rounded-md border border-border/40 bg-card px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder={t.contact.message}
          required
          minLength={10}
          maxLength={2000}
          className="rounded-md border border-border/40 bg-card px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />

        <Turnstile onVerify={onVerify} onExpire={onExpire} />

        <Button type="submit" disabled={loading}>
          {loading ? t.contact.sending : t.contact.send}
        </Button>
      </form>
    </section>
  );
}
