"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { formatPrice } from "@/lib/utils/format";

const ONTARIO_REBATE = 4000;
const TORONTO_REBATE = 4475;

export function LandTransferTaxCalculator() {
  const [price, setPrice] = useState(1000000);
  const [isToronto, setIsToronto] = useState(true);
  const [isFirstTimeBuyer, setIsFirstTimeBuyer] = useState(true);
  const [useTorontoSingleFamilyRates, setUseTorontoSingleFamilyRates] = useState(true);

  const result = useMemo(() => {
    const safePrice = Math.max(0, price);
    const ontarioTax = calculateMarginalTax(safePrice, ONTARIO_BRACKETS);
    const torontoTax = isToronto
      ? calculateMarginalTax(safePrice, useTorontoSingleFamilyRates ? TORONTO_SINGLE_FAMILY_BRACKETS : TORONTO_STANDARD_BRACKETS)
      : 0;
    const ontarioRebate = isFirstTimeBuyer ? Math.min(ONTARIO_REBATE, ontarioTax) : 0;
    const torontoRebate = isToronto && isFirstTimeBuyer ? Math.min(TORONTO_REBATE, torontoTax) : 0;

    return {
      ontarioTax,
      torontoTax,
      ontarioRebate,
      torontoRebate,
      totalBeforeRebates: ontarioTax + torontoTax,
      totalAfterRebates: Math.max(0, ontarioTax + torontoTax - ontarioRebate - torontoRebate)
    };
  }, [isFirstTimeBuyer, isToronto, price, useTorontoSingleFamilyRates]);

  return (
    <section className="not-prose rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
      <div className="flex items-start gap-4">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-900">
          <Calculator className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Estimate Tool</p>
          <h2 className="mt-2 font-heading text-3xl text-brand-900">Land Transfer Tax Calculator</h2>
          <p className="mt-3 text-sm leading-7 text-brand-700 sm:text-base">
            Estimate Ontario land transfer tax and, if applicable, Toronto municipal land transfer tax.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
        <div className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">Purchase Price</span>
            <input
              type="number"
              min={0}
              step={10000}
              value={price}
              onChange={(event) => setPrice(Number(event.target.value))}
              className="mt-1 h-12 w-full rounded-xl border border-brand-100 bg-brand-50 px-4 text-brand-900 outline-none focus:border-brand-400"
            />
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50/60 p-4 text-sm text-brand-800">
            <input
              type="checkbox"
              checked={isToronto}
              onChange={(event) => setIsToronto(event.target.checked)}
              className="mt-1"
            />
            <span>Property is in the City of Toronto</span>
          </label>

          {isToronto ? (
            <label className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50/60 p-4 text-sm text-brand-800">
              <input
                type="checkbox"
                checked={useTorontoSingleFamilyRates}
                onChange={(event) => setUseTorontoSingleFamilyRates(event.target.checked)}
                className="mt-1"
              />
              <span>Use Toronto high-value single-family residential rates where applicable</span>
            </label>
          ) : null}

          <label className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50/60 p-4 text-sm text-brand-800">
            <input
              type="checkbox"
              checked={isFirstTimeBuyer}
              onChange={(event) => setIsFirstTimeBuyer(event.target.checked)}
              className="mt-1"
            />
            <span>Apply first-time buyer rebates where eligible</span>
          </label>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Result label="Ontario LTT" value={formatPrice(result.ontarioTax)} />
            <Result label="Toronto MLTT" value={formatPrice(result.torontoTax)} />
            <Result label="Ontario Rebate" value={`-${formatPrice(result.ontarioRebate)}`} />
            <Result label="Toronto Rebate" value={`-${formatPrice(result.torontoRebate)}`} />
          </div>
          <div className="mt-4 rounded-2xl bg-brand-900 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-200">Estimated Total</p>
            <p className="mt-1 text-3xl font-semibold">{formatPrice(result.totalAfterRebates)}</p>
            <p className="mt-2 text-sm text-brand-100">
              Before rebates: {formatPrice(result.totalBeforeRebates)}
            </p>
          </div>
        </div>
      </div>
    </section>
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

function calculateMarginalTax(value: number, brackets: TaxBracket[]): number {
  return Math.round(
    brackets.reduce((total, bracket) => {
      const taxable = Math.max(0, Math.min(value, bracket.upTo) - bracket.from);
      return total + taxable * bracket.rate;
    }, 0)
  );
}

interface TaxBracket {
  from: number;
  upTo: number;
  rate: number;
}

const ONTARIO_BRACKETS: TaxBracket[] = [
  { from: 0, upTo: 55000, rate: 0.005 },
  { from: 55000, upTo: 250000, rate: 0.01 },
  { from: 250000, upTo: 400000, rate: 0.015 },
  { from: 400000, upTo: 2000000, rate: 0.02 },
  { from: 2000000, upTo: Number.POSITIVE_INFINITY, rate: 0.025 }
];

const TORONTO_STANDARD_BRACKETS: TaxBracket[] = [
  { from: 0, upTo: 55000, rate: 0.005 },
  { from: 55000, upTo: 250000, rate: 0.01 },
  { from: 250000, upTo: 400000, rate: 0.015 },
  { from: 400000, upTo: Number.POSITIVE_INFINITY, rate: 0.02 }
];

const TORONTO_SINGLE_FAMILY_BRACKETS: TaxBracket[] = [
  { from: 0, upTo: 55000, rate: 0.005 },
  { from: 55000, upTo: 250000, rate: 0.01 },
  { from: 250000, upTo: 400000, rate: 0.015 },
  { from: 400000, upTo: 2000000, rate: 0.02 },
  { from: 2000000, upTo: 3000000, rate: 0.025 },
  { from: 3000000, upTo: 4000000, rate: 0.044 },
  { from: 4000000, upTo: 5000000, rate: 0.0545 },
  { from: 5000000, upTo: 10000000, rate: 0.065 },
  { from: 10000000, upTo: 20000000, rate: 0.0755 },
  { from: 20000000, upTo: Number.POSITIVE_INFINITY, rate: 0.086 }
];
