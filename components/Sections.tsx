"use client";

import { MoneyInput, NumberInput, Card, SectionLabel } from "./ui";
import type { FinancialData, SimResult, MoneyFormatter } from "@/lib/types";

export function ProfileSection({
  data,
  update,
  money: _money,
  symbol,
}: {
  data: FinancialData;
  update: (patch: Partial<FinancialData>) => void;
  money: MoneyFormatter;
  symbol: string;
}) {
  return (
    <Card className="p-6">
      <SectionLabel>About you</SectionLabel>
      <div className="space-y-5">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-graphite/70 mb-1.5 font-mono">
            Current age
          </div>
          <NumberInput
            value={data.currentAge}
            onChange={(v) => update({ currentAge: Math.max(0, v) })}
            min={0}
            max={120}
            suffix="yrs"
          />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-widest text-graphite/70 mb-1.5 font-mono">
            Annual expenses today{" "}
            <span className="normal-case tracking-normal text-graphite/50">
              (housing, food, insurance, etc.)
            </span>
          </div>
          <MoneyInput
            value={data.annualExpenses}
            onChange={(v) => update({ annualExpenses: v })}
            symbol={symbol}
          />
        </div>
      </div>
    </Card>
  );
}

export function FutureExpensesSection({
  data,
  update,
  symbol,
  money: _money,
}: {
  data: FinancialData;
  update: (patch: Partial<FinancialData> | ((prev: FinancialData) => FinancialData)) => void;
  symbol: string;
  money: MoneyFormatter;
}) {
  function setEx(id: string, patch: Partial<FinancialData["futureExpenses"][0]>) {
    update((prev) => ({
      ...prev,
      futureExpenses: prev.futureExpenses.map((ex) =>
        ex.id === id ? { ...ex, ...patch } : ex
      ),
    }));
  }

  return (
    <Card className="p-6">
      <SectionLabel>Future expenses</SectionLabel>
      <div className="space-y-1">
        {data.futureExpenses.map((ex) => (
          <FutureRow key={ex.id} ex={ex} setEx={setEx} symbol={symbol} />
        ))}
      </div>
    </Card>
  );
}

function FutureRow({
  ex,
  setEx,
  symbol,
}: {
  ex: FinancialData["futureExpenses"][0];
  setEx: (id: string, patch: Partial<FinancialData["futureExpenses"][0]>) => void;
  symbol: string;
}) {
  return (
    <div
      className={`grid items-center gap-3 py-2 transition-opacity ${ex.enabled ? "" : "opacity-60"}`}
      style={{ gridTemplateColumns: "20px 1fr 120px 120px" }}
    >
      <input
        type="checkbox"
        className="check-box"
        checked={ex.enabled}
        onChange={(e) => setEx(ex.id, { enabled: e.target.checked })}
      />
      <div className="text-sm text-graphite font-medium">{ex.label}</div>
      <MoneyInput
        value={ex.amount}
        onChange={(v) => setEx(ex.id, { amount: v })}
        symbol={symbol}
        subtle
      />
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-mono text-graphite/70 uppercase">in</span>
        <NumberInput
          value={ex.startYear}
          onChange={(v) => setEx(ex.id, { startYear: v })}
          min={0}
          max={70}
          subtle
        />
        <span className="text-[11px] font-mono text-graphite/70">yrs</span>
      </div>
    </div>
  );
}

export function NetWorthSection({
  data,
  update,
  symbol,
  money,
  sim: _sim,
}: {
  data: FinancialData;
  update: (patch: Partial<FinancialData> | ((prev: FinancialData) => FinancialData)) => void;
  symbol: string;
  money: MoneyFormatter;
  sim: SimResult;
}) {
  const customSum = (data.customAssets || []).reduce(
    (acc, a) => acc + (Number(a.value) || 0),
    0
  );
  const liquidNow =
    (Number(data.stocks) || 0) +
    (Number(data.retirement) || 0) +
    customSum -
    (Number(data.debt) || 0);

  function setCustom(id: string, patch: Partial<FinancialData["customAssets"][0]>) {
    update((prev) => ({
      ...prev,
      customAssets: prev.customAssets.map((a) =>
        a.id === id ? { ...a, ...patch } : a
      ),
    }));
  }

  function removeCustom(id: string) {
    update((prev) => ({
      ...prev,
      customAssets: prev.customAssets.filter((a) => a.id !== id),
    }));
  }

  function addCustom() {
    update((prev) => ({
      ...prev,
      customAssets: [
        ...prev.customAssets,
        {
          id: "asset-" + Date.now(),
          label: "New asset",
          value: 0,
          contrib: 0,
          growthRate: 0.05,
        },
      ],
    }));
  }

  return (
    <Card className="p-6">
      <SectionLabel
        action={
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-widest text-graphite/70 font-mono">
              Net worth today
            </div>
            <div className="font-display text-[26px] leading-none">
              {money(liquidNow, { compact: true })}
            </div>
          </div>
        }
      >
        Net worth
      </SectionLabel>

      <div className="space-y-4">
        <NWRow
          label="Stocks & brokerage"
          value={data.stocks}
          contrib={data.stocksContrib}
          onValue={(v) => update({ stocks: v })}
          onContrib={(v) => update({ stocksContrib: v })}
          symbol={symbol}
          contribLabel="Added/yr"
          tone="amethyst"
        />
        <NWRow
          label="Retirement (401k, IRA)"
          value={data.retirement}
          contrib={data.retirementContrib}
          onValue={(v) => update({ retirement: v })}
          onContrib={(v) => update({ retirementContrib: v })}
          symbol={symbol}
          contribLabel="Added/yr"
          tone="sky"
        />

        {(data.customAssets || []).map((a) => (
          <NWRow
            key={a.id}
            label={a.label}
            editableLabel
            onLabel={(v) => setCustom(a.id, { label: v })}
            value={a.value}
            contrib={a.contrib}
            onValue={(v) => setCustom(a.id, { value: v })}
            onContrib={(v) => setCustom(a.id, { contrib: v })}
            symbol={symbol}
            contribLabel="Added/yr"
            tone="custom"
            removable
            onRemove={() => removeCustom(a.id)}
          />
        ))}

        <NWRow
          label="Debt"
          value={data.debt}
          contrib={data.debtPaidPerYear}
          onValue={(v) => update({ debt: v })}
          onContrib={(v) => update({ debtPaidPerYear: v })}
          symbol={symbol}
          contribLabel="Paid down/yr"
          subtract
        />

        <button
          onClick={addCustom}
          className="w-full mt-2 py-2.5 px-3 rounded-2xl border border-dashed border-border hover:border-ink hover:bg-base/60 transition text-sm text-graphite hover:text-ink flex items-center justify-center gap-1.5 whitespace-nowrap"
        >
          <span className="text-[16px] leading-none">+</span>
          <span>Add asset</span>
          <span className="text-[11px] font-mono text-graphite/50 ml-1 hidden sm:inline">
            (home, cash, 529, crypto…)
          </span>
        </button>

        <div className="flex items-center gap-2 pt-3 border-t border-border/60 text-sm text-graphite">
          <span>Stop contributions in</span>
          <input
            type="number"
            min={0}
            max={80}
            value={data.stopContributionsYears ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              update({
                stopContributionsYears:
                  raw === "" ? "" : Math.max(0, Number(raw)),
              });
            }}
            placeholder="—"
            className="input-subtle w-16 text-center font-mono text-[13px] tabular-nums"
          />
          <span>years</span>
          <span className="text-[11px] font-mono text-graphite/50 ml-auto">
            {data.stopContributionsYears === "" || data.stopContributionsYears == null
              ? "never — contribute through retirement"
              : `contributions stop at age ${data.currentAge + Number(data.stopContributionsYears)}`}
          </span>
        </div>
      </div>
    </Card>
  );
}

function NWRow({
  label,
  editableLabel,
  onLabel,
  value,
  contrib,
  onValue,
  onContrib,
  symbol,
  contribLabel,
  subtract = false,
  tone,
  removable,
  onRemove,
}: {
  label: string;
  editableLabel?: boolean;
  onLabel?: (v: string) => void;
  value: number;
  contrib?: number;
  onValue: (v: number) => void;
  onContrib?: (v: number) => void;
  symbol: string;
  contribLabel?: string;
  subtract?: boolean;
  tone?: "amethyst" | "sky" | "custom";
  removable?: boolean;
  onRemove?: () => void;
}) {
  const dotColor =
    tone === "amethyst"
      ? "bg-amethyst-deep"
      : tone === "sky"
      ? "bg-sky-deep"
      : tone === "custom"
      ? "bg-graphite/40"
      : "bg-graphite/30";

  return (
    <div className="grid gap-3 items-end" style={{ gridTemplateColumns: "1fr 140px 140px 28px" }}>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`relative w-1.5 h-6 rounded-full ${dotColor} shrink-0`} />
        {editableLabel && onLabel ? (
          <input
            value={label}
            onChange={(e) => onLabel(e.target.value)}
            className="input-subtle text-sm font-medium text-graphite min-w-0 flex-1"
          />
        ) : (
          <span className="text-sm font-medium text-graphite truncate">
            {label}
            {subtract ? (
              <span className="text-graphite/50 ml-1">(subtract)</span>
            ) : null}
          </span>
        )}
      </div>
      <MoneyInput value={value} onChange={onValue} symbol={symbol} />
      {onContrib && contrib !== undefined ? (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-graphite/60 mb-0.5">
            {contribLabel}
          </div>
          <MoneyInput value={contrib} onChange={onContrib} symbol={symbol} subtle />
        </div>
      ) : (
        <span />
      )}
      {removable && onRemove ? (
        <button
          className="w-7 h-7 inline-flex items-center justify-center rounded-full text-graphite/60 hover:bg-base hover:text-ink transition"
          onClick={onRemove}
          title="Remove asset"
          aria-label="Remove asset"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 2L10 10M10 2L2 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      ) : (
        <span />
      )}
    </div>
  );
}
