import type { FinancialData, SimResult, MoneyFormatter } from "./types";

export const HORIZON_AGE = 110;

function projectPortfolio({
  start,
  contribPerYear,
  growthRate,
  years,
  stopContribAfter,
}: {
  start: number;
  contribPerYear: number;
  growthRate: number;
  years: number;
  stopContribAfter?: number | '';
}): number[] {
  const out = [start];
  let v = start;
  for (let i = 1; i <= years; i++) {
    const c =
      stopContribAfter != null &&
      stopContribAfter !== '' &&
      i > Number(stopContribAfter)
        ? 0
        : contribPerYear;
    v = v * (1 + growthRate) + c;
    if (v < 0) v = 0;
    out.push(v);
  }
  return out;
}

function projectDebt({
  start,
  paidDownPerYear,
  years,
}: {
  start: number;
  paidDownPerYear: number;
  years: number;
}): number[] {
  const out = [start];
  let d = start;
  for (let i = 1; i <= years; i++) {
    d = Math.max(0, d - paidDownPerYear);
    out.push(d);
  }
  return out;
}

function futureExpenseAt(year: number, futureExpenses: FinancialData['futureExpenses']): number {
  let total = 0;
  for (const ex of futureExpenses) {
    if (!ex.enabled) continue;
    if (year >= ex.startYear) total += Number(ex.amount) || 0;
  }
  return total;
}

function fireTarget(annualExpenses: number, swr: number): number {
  if (!swr) return Infinity;
  return annualExpenses / swr;
}

function yearsTo(series: number[], target: number): number | null {
  for (let i = 0; i < series.length; i++) {
    if (series[i] >= target) return i;
  }
  return null;
}

function coastFire({
  currentAge,
  target,
  rate,
  series,
}: {
  currentAge: number;
  target: number;
  rate: number;
  series: number[];
}) {
  const years = Math.max(1, 65 - currentAge);
  const coastNeed = target / Math.pow(1 + rate, years);
  return { coastNeed, yearsReached: yearsTo(series, coastNeed) };
}

export function makeMoney(symbol: string, rate: number): MoneyFormatter {
  return (n, opts = {}) => {
    if (n === Infinity || isNaN(n)) return '—';
    const { compact = false, decimals = 0 } = opts;
    const v = (n || 0) * (rate || 1);
    if (compact) {
      const abs = Math.abs(v);
      if (abs >= 1e9) return `${symbol}${(v / 1e9).toFixed(1)}B`;
      if (abs >= 1e6) return `${symbol}${(v / 1e6).toFixed(2)}M`;
      if (abs >= 1e3) return `${symbol}${(v / 1e3).toFixed(0)}K`;
      return `${symbol}${v.toFixed(0)}`;
    }
    return `${symbol}${v.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  };
}

export function simulate(financialData: FinancialData): SimResult {
  const {
    currentAge,
    annualExpenses,
    futureExpenses,
    stocks,
    stocksContrib,
    retirement,
    retirementContrib,
    debt,
    debtPaidPerYear,
    customAssets,
    marketRate,
    inflationRate,
    swr,
    stopContributionsYears,
  } = financialData;

  const years = Math.max(1, HORIZON_AGE - currentAge);
  const horizon = Array.from({ length: years + 1 }, (_, i) => i);
  const stopAfter = stopContributionsYears;

  const stocksSeries = projectPortfolio({
    start: Number(stocks) || 0,
    contribPerYear: Number(stocksContrib) || 0,
    growthRate: marketRate,
    years,
    stopContribAfter: stopAfter,
  });
  const retSeries = projectPortfolio({
    start: Number(retirement) || 0,
    contribPerYear: Number(retirementContrib) || 0,
    growthRate: marketRate,
    years,
    stopContribAfter: stopAfter,
  });
  const debtSeries = projectDebt({
    start: Number(debt) || 0,
    paidDownPerYear: Number(debtPaidPerYear) || 0,
    years,
  });

  const liquidSeries = stocksSeries.map((s, i) => s + retSeries[i]);

  const customAssetProjections = (customAssets || []).map((a) =>
    projectPortfolio({
      start: Number(a.value) || 0,
      contribPerYear: Number(a.contrib) || 0,
      growthRate: Number(a.growthRate) >= 0 ? Number(a.growthRate) : marketRate,
      years,
      stopContribAfter: stopAfter,
    })
  );

  const netWorthSeries = horizon.map((i) => {
    let v = liquidSeries[i] - debtSeries[i];
    for (const s of customAssetProjections) v += s[i];
    return v;
  });

  const futureExtra = futureExpenseAt(0, futureExpenses);
  const todayExpenses = (Number(annualExpenses) || 0) + futureExtra;
  const target = fireTarget(todayExpenses, swr);

  const benchmarks = {
    coast: coastFire({
      currentAge,
      target,
      rate: marketRate - inflationRate,
      series: liquidSeries,
    }),
    barista: { value: target * 0.5, yearsReached: yearsTo(liquidSeries, target * 0.5) },
    lean: { value: target * 0.7, yearsReached: yearsTo(liquidSeries, target * 0.7) },
    chubby: { value: target, yearsReached: yearsTo(liquidSeries, target) },
    fat: { value: target * 1.5, yearsReached: yearsTo(liquidSeries, target * 1.5) },
  };

  return {
    horizon,
    netWorthSeries,
    liquidSeries,
    stocksSeries,
    retSeries,
    debtSeries,
    customAssetSeries: (customAssets || []).map((a, idx) => ({
      id: a.id,
      label: a.label,
      series: customAssetProjections[idx],
    })),
    target,
    todayExpenses,
    benchmarks,
    years,
  };
}
