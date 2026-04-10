"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { CURRENCIES, type CurrencyCode } from "@lunark/shared";

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  convert: (eurPrice: number) => number;
  format: (eurPrice: number) => string;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("EUR");

  useEffect(() => {
    const saved = localStorage.getItem("lunark-currency") as CurrencyCode | null;
    if (saved && saved in CURRENCIES) {
      setCurrencyState(saved);
    }
  }, []);

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    localStorage.setItem("lunark-currency", code);
  }, []);

  const convert = useCallback(
    (eurPrice: number) => {
      const rate = CURRENCIES[currency].rate;
      return Math.round(eurPrice * rate * 100) / 100;
    },
    [currency]
  );

  const format = useCallback(
    (eurPrice: number) => {
      const converted = convert(eurPrice);
      const { symbol } = CURRENCIES[currency];
      // For currencies where symbol comes before the number
      const prefixSymbols = ["$", "£", "R$", "CA$", "A$", "¥", "₹", "₩", "MX$", "AR$", "R", "S$", "NZ$", "₺", "฿"];
      if (prefixSymbols.includes(symbol)) {
        return `${symbol}${converted.toFixed(2)}`;
      }
      return `${converted.toFixed(2)} ${symbol}`;
    },
    [currency, convert]
  );

  const symbol = CURRENCIES[currency].symbol;

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, format, symbol }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
