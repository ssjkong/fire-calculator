export interface Kid {
  id: number | string;
  age: number;
  cost?: number;
}

export interface FutureExpense {
  id: string;
  label: string;
  amount: number;
  startYear: number;
  perYear: boolean;
  enabled: boolean;
}

export interface CustomAsset {
  id: string;
  label: string;
  value: number;
  contrib: number;
  growthRate: number;
}

export interface BenchmarkVisibility {
  coast: boolean;
  barista: boolean;
  lean: boolean;
  chubby: boolean;
  fat: boolean;
}

export type BenchmarkKey = keyof BenchmarkVisibility;

export interface FinancialData {
  currentAge: number;
  annualExpenses: number;
  kidsEnabled: boolean;
  kids: Kid[];
  kidDefaultCost: number;
  futureExpenses: FutureExpense[];
  stocks: number;
  stocksContrib: number;
  retirement: number;
  retirementContrib: number;
  debt: number;
  debtPaidPerYear: number;
  customAssets: CustomAsset[];
  benchmarks: BenchmarkVisibility;
  marketRate: number;
  inflationRate: number;
  swr: number;
  stopContributionsYears: number | '';
  activeBenchmark: BenchmarkKey;
  currency: string;
}

export interface BenchmarkResult {
  value: number;
  yearsReached: number | null;
}

export interface CoastResult {
  coastNeed: number;
  yearsReached: number | null;
}

export interface SimResult {
  horizon: number[];
  netWorthSeries: number[];
  liquidSeries: number[];
  stocksSeries: number[];
  retSeries: number[];
  debtSeries: number[];
  customAssetSeries: { id: string; label: string; series: number[] }[];
  target: number;
  todayExpenses: number;
  benchmarks: {
    coast: CoastResult;
    barista: BenchmarkResult;
    lean: BenchmarkResult;
    chubby: BenchmarkResult;
    fat: BenchmarkResult;
  };
  years: number;
}

export type MoneyFormatter = (n: number, opts?: { compact?: boolean; decimals?: number }) => string;

export interface CurrencyMeta {
  code: string;
  symbol: string;
  label: string;
}

export interface CurrencyState extends CurrencyMeta {
  rate: number;
  status: 'loading' | 'ready' | 'error';
  all: CurrencyMeta[];
}
