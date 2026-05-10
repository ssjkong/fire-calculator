"use client";

import { useState, useEffect, useCallback } from "react";
import type { FinancialData, CurrencyMeta, CurrencyState } from "./types";

const STORAGE_KEY = "fire-calc-v1";

export const DEFAULT_DATA: FinancialData = {
  currentAge: 32,
  annualExpenses: 80000,
  kidsEnabled: true,
  kids: [
    { id: 1, age: 2 },
    { id: 2, age: 0 },
  ],
  kidDefaultCost: 20000,
  futureExpenses: [
    { id: "health", label: "Health insurance", amount: 12000, startYear: 0, perYear: true, enabled: false },
    { id: "retire-comm", label: "Retirement community", amount: 60000, startYear: 33, perYear: true, enabled: false },
    { id: "higher-ed", label: "Higher education", amount: 30000, startYear: 16, perYear: true, enabled: false },
    { id: "home", label: "Home purchase & maintenance", amount: 15000, startYear: 2, perYear: true, enabled: false },
    { id: "travel", label: "Travel", amount: 10000, startYear: 0, perYear: true, enabled: false },
  ],
  stocks: 120000,
  stocksContrib: 24000,
  retirement: 180000,
  retirementContrib: 23000,
  debt: 30000,
  debtPaidPerYear: 8000,
  customAssets: [
    { id: "home", label: "Home equity", value: 90000, contrib: 0, growthRate: 0.035 },
    { id: "cash", label: "Cash reserve", value: 35000, contrib: 0, growthRate: 0.04 },
  ],
  benchmarks: { coast: true, barista: false, lean: true, chubby: true, fat: true },
  marketRate: 0.07,
  inflationRate: 0.03,
  swr: 0.04,
  stopContributionsYears: "",
  activeBenchmark: "lean",
  currency: "USD",
};

function loadStored(): FinancialData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_DATA,
      ...parsed,
      benchmarks: { ...DEFAULT_DATA.benchmarks, ...(parsed.benchmarks || {}) },
      futureExpenses:
        parsed.futureExpenses && parsed.futureExpenses.length
          ? parsed.futureExpenses
          : DEFAULT_DATA.futureExpenses,
      kids: parsed.kids || DEFAULT_DATA.kids,
      customAssets: parsed.customAssets || DEFAULT_DATA.customAssets,
    };
  } catch {
    return DEFAULT_DATA;
  }
}

export function useFinancialData(): [
  FinancialData,
  (patch: Partial<FinancialData> | ((prev: FinancialData) => FinancialData)) => void,
  () => void,
] {
  const [data, setData] = useState<FinancialData>(loadStored);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }, [data]);

  const update = useCallback(
    (patch: Partial<FinancialData> | ((prev: FinancialData) => FinancialData)) => {
      setData((prev) =>
        typeof patch === "function" ? patch(prev) : { ...prev, ...patch }
      );
    },
    []
  );

  const reset = useCallback(() => setData(DEFAULT_DATA), []);

  return [data, update, reset];
}

export const CURRENCIES: CurrencyMeta[] = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar" },
];

export function useCurrency(activeCode: string): CurrencyState {
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("https://api.frankfurter.dev/v1/latest?base=USD")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        setRates({ USD: 1, ...j.rates });
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setRates({ USD: 1, EUR: 0.92, GBP: 0.79, JPY: 156, AUD: 1.52, CAD: 1.37 });
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const meta = CURRENCIES.find((c) => c.code === activeCode) || CURRENCIES[0];
  const rate = rates[activeCode] || 1;

  return { rate, symbol: meta.symbol, label: meta.label, code: meta.code, status, all: CURRENCIES };
}
