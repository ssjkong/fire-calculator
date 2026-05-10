"use client";

import { useMemo, useState, useRef } from "react";
import { useFinancialData, useCurrency, CURRENCIES } from "@/lib/hooks";
import { simulate, makeMoney } from "@/lib/calc";
import { Card } from "./ui";
import { FireChart, BENCHMARK_META } from "./FireChart";
import {
  ProfileSection,
  FutureExpensesSection,
  NetWorthSection,
} from "./Sections";
import type { FinancialData, SimResult, MoneyFormatter } from "@/lib/types";

export default function FireApp() {
  const [data, update, reset] = useFinancialData();
  const cur = useCurrency(data.currency);
  const money = useMemo(
    () => makeMoney(cur.symbol, cur.rate),
    [cur.symbol, cur.rate]
  );
  const sim = useMemo(() => simulate(data), [data]);

  const active = data.activeBenchmark || "lean";
  const activeMeta = BENCHMARK_META[active];
  const yearsToActive =
    active === "coast"
      ? sim.benchmarks.coast.yearsReached
      : sim.benchmarks[active as keyof typeof sim.benchmarks].yearsReached;

  return (
    <div className="min-h-screen pb-40">
      <header className="px-6 md:px-10 pt-8 pb-4 max-w-[1480px] mx-auto flex items-end justify-between gap-6 flex-wrap">
        <div className="flex items-baseline gap-3 flex-wrap min-w-0">
          <div className="font-display text-[34px] leading-none whitespace-nowrap">
            FIRE Calculator
          </div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-graphite/60 whitespace-nowrap">
            v.0.2 · personal finance · retirement
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-border/70 hover:bg-ink hover:text-white transition text-[11px] font-mono uppercase tracking-widest"
            title="Save as PDF (uses browser print dialog)"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path
                d="M5.5 1V7M5.5 7L3 4.5M5.5 7L8 4.5M2 9H9"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Download PDF
          </button>
          <button
            onClick={() => {
              if (confirm("Reset all inputs to defaults?")) reset();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-base text-[11px] font-mono uppercase tracking-widest text-graphite/70 hover:text-ink transition"
          >
            Reset ↺
          </button>
        </div>
      </header>

      <main className="px-6 md:px-10 max-w-[1480px] mx-auto">
        <div className="flex items-center gap-3 pb-5 mb-5 border-b border-border/60 flex-wrap">
          <div className="text-[11px] uppercase tracking-widest font-mono text-graphite/70">
            Your goal
          </div>
          <BenchmarkPicker data={data} update={update} sim={sim} money={money} align="left" />
          <div className="text-[11px] font-mono text-graphite/50 ml-1">
            — drives the big number on the right
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="lg:w-[520px] xl:w-[560px] flex flex-col gap-5 shrink-0 w-full">
            <ProfileSection data={data} update={update} money={money} symbol={cur.symbol} />
            <FutureExpensesSection data={data} update={update} symbol={cur.symbol} money={money} />
            <NetWorthSection data={data} update={update} symbol={cur.symbol} money={money} sim={sim} />
          </div>

          <div className="flex-1 flex flex-col gap-4 min-w-0 w-full lg:sticky lg:top-6 self-start lg:pb-24">
            <Headline
              data={data}
              update={update}
              sim={sim}
              money={money}
              active={active}
              activeMeta={activeMeta}
              yearsToActive={yearsToActive}
            />
            <ChartPanel data={data} update={update} sim={sim} money={money} />
          </div>
        </div>

        <div className="mt-10 text-center text-[11px] font-mono uppercase tracking-widest text-graphite/40">
          Estimates only · not financial advice ·{" "}
          {cur.status === "ready"
            ? "live FX"
            : cur.status === "loading"
            ? "loading FX…"
            : "cached FX"}{" "}
          via frankfurter.dev
        </div>
      </main>

      <FooterPill cur={cur} update={update} />
    </div>
  );
}

function Headline({
  data,
  update: _update,
  sim,
  money,
  active,
  activeMeta,
  yearsToActive,
}: {
  data: FinancialData;
  update: (patch: Partial<FinancialData>) => void;
  sim: SimResult;
  money: MoneyFormatter;
  active: string;
  activeMeta: { label: string; color: string };
  yearsToActive: number | null;
}) {
  const yearReached =
    yearsToActive !== null ? new Date().getFullYear() + yearsToActive : null;
  const isCoast = active === "coast";
  const headlineLabel = isCoast
    ? "You can stop contributing in"
    : "You can retire in";

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-5">
      <Card tone="amethyst" className="p-6 flex flex-col justify-between min-h-[180px]">
        <div className="text-[11px] font-mono uppercase tracking-widest text-graphite/70">
          FIRE target
        </div>
        <div className="font-display text-[40px] leading-[0.95]">
          {money(sim.target, { compact: true })}
        </div>
        <div>
          <div className="text-[12px] text-graphite/80 leading-snug mb-1">
            At a {(data.swr * 100).toFixed(0)}% safe withdrawal rate ·{" "}
            {money(sim.todayExpenses, { compact: false })}/yr today
          </div>
          <div className="text-[11px] font-mono uppercase tracking-widest" style={{ color: activeMeta.color }}>
            {activeMeta.label} FIRE
          </div>
        </div>
      </Card>

      <Card className="p-6 relative overflow-hidden">
        <div className="text-[12px] uppercase tracking-widest font-mono text-graphite/70">
          {headlineLabel}
        </div>
        <div className="mt-2 flex items-baseline gap-3 whitespace-nowrap">
          <span className="font-display text-[88px] leading-[0.85] tracking-tight">
            {yearsToActive !== null ? yearsToActive : "∞"}
          </span>
          <span className="font-display text-[26px] leading-none text-graphite/80">yrs</span>
          {yearReached ? (
            <span className="font-display text-[26px] leading-none text-graphite/60">
              ({yearReached})
            </span>
          ) : (
            <span className="text-[13px] text-graphite/60">— not reached by 110</span>
          )}
        </div>
        <div className="text-[13px] text-graphite/70 mt-3 max-w-[44ch]">
          {isCoast
            ? "Once you hit the coast number, market returns alone get you to the FIRE target by 65 — no more contributions required."
            : "If your annual expenses don't change & lifestyle doesn't creep. Adjust assumptions in the chart panel."}
        </div>
      </Card>
    </div>
  );
}

function BenchmarkPicker({
  data,
  update,
  sim,
  money,
  align = "bottom",
}: {
  data: FinancialData;
  update: (patch: Partial<FinancialData>) => void;
  sim: SimResult;
  money: MoneyFormatter;
  align?: "left" | "bottom";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const meta = BENCHMARK_META[data.activeBenchmark];
  const popClass =
    align === "left"
      ? "absolute top-full mt-2 left-0"
      : "absolute bottom-full mb-2 left-0";

  return (
    <div className="relative" style={{ zIndex: 30 }}>
      <button
        ref={ref}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-base border border-border/70 hover:bg-ink hover:text-white transition text-[12px] font-mono uppercase tracking-widest"
      >
        <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
        {meta.label} FIRE
        <span className="opacity-60">▾</span>
      </button>
      {open ? (
        <div
          className={`${popClass} bg-surface rounded-2xl border border-border/60 shadow-pop p-3 popover-pop`}
          style={{ minWidth: 260, zIndex: 40 }}
        >
          <div className="text-[11px] font-mono uppercase tracking-widest text-graphite/60 mb-2">
            Pick benchmark
          </div>
          {Object.entries(BENCHMARK_META).map(([key, m]) => {
            const bm = sim.benchmarks[key as keyof typeof sim.benchmarks];
            const v =
              key === "coast"
                ? (bm as { coastNeed: number }).coastNeed
                : (bm as { value: number }).value;
            const yrs = bm.yearsReached;
            return (
              <button
                key={key}
                onClick={() => {
                  update({ activeBenchmark: key as FinancialData["activeBenchmark"] });
                  setOpen(false);
                }}
                className={`w-full grid items-center gap-2 px-2 py-2 rounded-lg hover:bg-base text-left ${
                  data.activeBenchmark === key ? "bg-base" : ""
                }`}
                style={{ gridTemplateColumns: "14px 1fr auto" }}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />
                <div>
                  <div className="text-sm font-medium">{m.label}</div>
                  <div className="text-[11px] text-graphite/60">
                    {money(v, { compact: true })}
                  </div>
                </div>
                <div className="text-[11px] font-mono text-graphite/70">
                  {yrs === null ? "∞" : `${yrs}y`}
                </div>
              </button>
            );
          })}
          <button
            onClick={() => setOpen(false)}
            className="fixed inset-0 -z-10"
          />
        </div>
      ) : null}
      {open ? (
        <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
      ) : null}
    </div>
  );
}

function ChartPanel({
  data,
  update,
  sim,
  money,
}: {
  data: FinancialData;
  update: (patch: Partial<FinancialData>) => void;
  sim: SimResult;
  money: MoneyFormatter;
}) {
  return (
    <Card className="p-5 flex flex-col gap-4 flex-1">
      <FireChart
        sim={sim}
        data={data}
        money={money}
        currentAge={data.currentAge}
        onActivateBenchmark={(k) =>
          update({ activeBenchmark: k as FinancialData["activeBenchmark"] })
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-8 pt-4 border-t border-border/60">
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest font-mono text-graphite/70 mb-3">
              Retirement benchmarks
            </div>
            <div className="space-y-2">
              {Object.entries(BENCHMARK_META).map(([key, meta]) => (
                <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="check-box"
                    checked={!!data.benchmarks[key as keyof typeof data.benchmarks]}
                    onChange={(e) =>
                      update({
                        benchmarks: {
                          ...data.benchmarks,
                          [key]: e.target.checked,
                        },
                      })
                    }
                  />
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: meta.color }}
                  />
                  <span className="text-sm">{meta.label}</span>
                  <span className="text-[11px] text-graphite/50 group-hover:text-graphite/80 transition truncate">
                    {meta.desc}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-widest font-mono text-graphite/70 mb-3">
            Assumptions
          </div>
          <div className="space-y-3">
            <PercentRow
              label="Market return"
              value={data.marketRate}
              onChange={(v) => update({ marketRate: v })}
              min={0.02}
              max={0.12}
            />
            <PercentRow
              label="Inflation"
              value={data.inflationRate}
              onChange={(v) => update({ inflationRate: v })}
              min={0}
              max={0.08}
            />
            <PercentRow
              label="Safe withdrawal (SWR)"
              value={data.swr}
              onChange={(v) => update({ swr: v })}
              min={0.025}
              max={0.06}
              step={0.0025}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

function PercentRow({
  label,
  value,
  onChange,
  min = 0,
  max = 0.15,
  step = 0.005,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm text-graphite">{label}</div>
        <div className="font-mono text-[12px] tabular-nums">
          {(value * 100).toFixed(value < 0.05 ? 2 : 1)}%
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-ink"
      />
    </div>
  );
}

function FooterPill({
  cur,
  update,
}: {
  cur: ReturnType<typeof useCurrency>;
  update: (patch: Partial<FinancialData>) => void;
}) {
  const [curOpen, setCurOpen] = useState(false);

  return (
    <div className="fixed bottom-5 left-5 z-40 fade-in print:hidden">
      <div className="bg-surface rounded-full shadow-pop border border-border/60 pl-2 pr-2 py-1.5 flex items-center gap-1">
        <SignatureChip />
        <div className="w-px h-5 bg-border/70" />
        <div className="relative">
          <button
            onClick={() => setCurOpen((o) => !o)}
            className="px-3 py-1.5 rounded-full hover:bg-base text-sm flex items-center gap-2 transition"
          >
            <span className="font-mono text-[13px]">{cur.symbol}</span>
            <span className="font-mono text-[12px] text-graphite/70">{cur.code}</span>
            <span className="opacity-50">▾</span>
          </button>
          {curOpen ? (
            <div
              className="absolute bottom-full mb-3 right-0 bg-surface rounded-2xl border border-border/60 shadow-pop p-1.5 popover-pop"
              style={{ minWidth: 180 }}
            >
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    update({ currency: c.code });
                    setCurOpen(false);
                  }}
                  className={`w-full grid items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-base text-left ${
                    cur.code === c.code ? "bg-base" : ""
                  }`}
                  style={{ gridTemplateColumns: "24px 28px 1fr" }}
                >
                  <span className="font-mono text-[13px]">{c.symbol}</span>
                  <span className="font-mono text-[12px]">{c.code}</span>
                  <span className="text-sm text-graphite/80">{c.label}</span>
                </button>
              ))}
              <div className="text-[10px] font-mono uppercase tracking-widest text-graphite/40 px-2 pt-1.5 pb-1">
                FX via frankfurter.dev
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SignatureChip() {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="relative px-3 py-1.5 text-sm flex items-center gap-2 cursor-default whitespace-nowrap"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span className="w-5 h-5 rounded-full bg-amethyst flex items-center justify-center font-display text-[13px]">
        S
      </span>
      <span className="text-[13px] text-graphite">Experiment</span>
      <span className="text-[13px] text-graphite/50">by</span>
      <span className="text-[13px] font-medium underline decoration-dotted underline-offset-4">
        Sharon Kong
      </span>
      {hover ? (
        <div className="absolute bottom-full mb-3 right-0 bg-ink text-white rounded-xl px-3 py-2 text-[11px] popover-pop whitespace-nowrap">
          Built as a side project · May 2026
        </div>
      ) : null}
    </div>
  );
}
