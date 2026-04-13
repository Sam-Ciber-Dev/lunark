import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Methods",
  description: "Lunark accepted payment methods — credit cards, digital wallets, bank transfers, and buy now pay later options.",
  openGraph: { title: "Payment Methods — Lunark", description: "Secure payment options including Visa, PayPal, Klarna, MB WAY, and more." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
