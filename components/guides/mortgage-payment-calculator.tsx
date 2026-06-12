"use client";

import { useMemo, useState } from "react";
import { Calculator, Percent } from "lucide-react";
import { formatPrice } from "@/lib/utils/format";

interface MortgagePaymentCalculatorProps {
  initialPrice?: number;
  compact?: boolean;
}

const DEFAULT_PRICE = 1000000;
const DEFAULT_DOWN_PAYMENT_PERCENT = 20;
const DEFAULT_RATE = 4.89;
const DEFAULT_AMORTIZATION_YEARS = 25;
const DEFAULT_TERM_YEARS = 5;
const MONTHS_PER_YEAR = 12;

export function MortgagePaymentCalculator({ initialPrice = DEFAULT_PRICE, compact = false }: MortgagePaymentCalculatorProps) {
  const [purchasePrice, setPurchasePrice] = useState(Math.max(0, Math.round(initialPrice)));
  const [downPaymentPercent, setDownPaymentPercent] = useState(DEFAULT_DOWN_PAYMENT_PERCENT);
  const [interestRate, setInterestRate] = useState(DEFAULT_RATE);
  const [amortizationYears, setAmortizationYears] = useState(DEFAULT_AMORTIZATION_YEARS);
  const [termYears, setTermYears] = useState(DEFAULT_TERM_YEARS);
  const [propertyTaxMonthly, setPropertyTaxMonthly] = useState(500);
  const [condoFeesMonthly, setCondoFeesMonthly] = useState(0);
  const [heatingMonthly, setHeatingMonthly] = useState(150);

  const result = useMemo(() => {
    const safePrice = Math.max(0, purchasePrice);
    const downPayment = Math.round(safePrice * (Math.max(0, downPaymentPercent) / 100));
    const mortgageAmount = Math.max(0, safePrice - downPayment);
    const monthlyRate = Math.max(0, interestRate) / 100 / MONTHS_PER_YEAR;
    const amortizationMonths = Math.max(1, amortizationYears * MONTHS_PER_YEAR);
    const monthlyPrincipalInterest =
      monthlyRate === 0
        ? mortgageAmount / amortizationMonths
        : mortgageAmount *
          ((monthlyRate * Math.pow(1 + monthlyRate, amortizationMonths)) /
            (Math.pow(1 + monthlyRate, amortizationMonths) - 1));
    const monthlyCarryingCost =
      monthlyPrincipalInterest + Math.max(0, propertyTaxMonthly) + Math.max(0, condoFeesMonthly) + Math.max(0, heatingMonthly);
    const termMonths = Math.max(1, termYears * MONTHS_PER_YEAR);
    const termPayments = monthlyPrincipalInterest * termMonths;

    return {
      downPayment,
      mortgageAmount,
      monthlyPrincipalInterest: Math.round(monthlyPrincipalInterest),
      monthlyCarryingCost: Math.round(monthlyCarryingCost),
      termPayments: Math.round(termPayments)
    };
  }, [amortizationYears, condoFeesMonthly, downPaymentPercent, heatingMonthly, interestRate, propertyTaxMonthly, purchasePrice, termYears]);

  return (
    <section className={`not-prose rounded-[2rem] border border-brand-100 bg-white shadow-soft ${compact ? "p-5" : "p-6 sm:p-8"}`}>
      <div className="flex items-start gap-4">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-900">
          <Calculator className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Estimate Tool</p>
          <h2 className={`mt-2 font-heading text-brand-900 ${compact ? "text-2xl" : "text-3xl"}`}>Mortgage Payment Calculator</h2>
          <p className="mt-3 text-sm leading-7 text-brand-700">
            Estimate monthly principal and interest, then add common carrying costs for a clearer planning number.
          </p>
        </div>
      </div>

      <div className={`mt-6 grid gap-6 ${compact ? "" : "lg:grid-cols-[0.95fr,1.05fr]"}`}>
        <div className="space-y-4">
          <MoneyInput label="Purchase Price" value={purchasePrice} step={10000} onChange={setPurchasePrice} />

          <div className="grid gap-3 sm:grid-cols-2">
            <NumberInput
              label="Down Payment"
              value={downPaymentPercent}
              min={0}
              max={100}
              step={1}
              suffix="%"
              onChange={setDownPaymentPercent}
            />
            <NumberInput
              label="Interest Rate"
              value={interestRate}
              min={0}
              max={25}
              step={0.01}
              suffix="%"
              onChange={setInterestRate}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SelectInput
              label="Amortization"
              value={amortizationYears}
              options={[15, 20, 25, 30]}
              suffix="years"
              onChange={setAmortizationYears}
            />
            <SelectInput label="Term" value={termYears} options={[1, 2, 3, 4, 5]} suffix="years" onChange={setTermYears} />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MoneyInput label="Property Tax / Month" value={propertyTaxMonthly} step={25} onChange={setPropertyTaxMonthly} />
            <MoneyInput label="Condo Fees / Month" value={condoFeesMonthly} step={25} onChange={setCondoFeesMonthly} />
            <MoneyInput label="Heating / Month" value={heatingMonthly} step={25} onChange={setHeatingMonthly} />
          </div>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Result label="Down Payment" value={formatPrice(result.downPayment)} />
            <Result label="Mortgage Amount" value={formatPrice(result.mortgageAmount)} />
            <Result label="Principal + Interest" value={`${formatPrice(result.monthlyPrincipalInterest)} / mo`} />
            <Result label={`${termYears}-Year Term Payments`} value={formatPrice(result.termPayments)} />
          </div>
          <div className="mt-4 rounded-2xl bg-brand-900 p-5 text-white">
            <div className="flex items-center gap-2 text-brand-200">
              <Percent className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-wide">Estimated Monthly Carrying Cost</p>
            </div>
            <p className="mt-2 text-3xl font-semibold">{formatPrice(result.monthlyCarryingCost)}</p>
            <p className="mt-2 text-sm text-brand-100">
              Includes principal, interest, property tax, condo fees, and heating estimates.
            </p>
          </div>
          <p className="mt-4 text-xs leading-6 text-brand-600">
            This is a planning estimate only. It excludes mortgage insurance, lender qualification rules, legal fees,
            insurance, utilities beyond heating, and other closing or ownership costs.
          </p>
        </div>
      </div>
    </section>
  );
}

function MoneyInput({
  label,
  value,
  step,
  onChange
}: {
  label: string;
  value: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">{label}</span>
      <input
        type="number"
        min={0}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 h-12 w-full rounded-xl border border-brand-100 bg-brand-50 px-4 text-brand-900 outline-none focus:border-brand-400"
      />
    </label>
  );
}

function NumberInput({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">{label}</span>
      <div className="mt-1 flex h-12 overflow-hidden rounded-xl border border-brand-100 bg-brand-50 focus-within:border-brand-400">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="min-w-0 flex-1 bg-transparent px-4 text-brand-900 outline-none"
        />
        <span className="inline-flex items-center border-l border-brand-100 px-3 text-sm font-semibold text-brand-600">{suffix}</span>
      </div>
    </label>
  );
}

function SelectInput({
  label,
  value,
  options,
  suffix,
  onChange
}: {
  label: string;
  value: number;
  options: number[];
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 h-12 w-full rounded-xl border border-brand-100 bg-brand-50 px-4 text-brand-900 outline-none focus:border-brand-400"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option} {suffix}
          </option>
        ))}
      </select>
    </label>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-brand-100 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-brand-900">{value}</p>
    </div>
  );
}
