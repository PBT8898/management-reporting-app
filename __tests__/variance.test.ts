import test from "node:test";
import assert from "node:assert/strict";
import { variance, computeVariances, kpis } from "../lib/utils/variance.ts";
test("materiality requires both strict thresholds", () => {
  assert.equal(variance(450000, 400000).material, true);
  assert.equal(variance(450000, 420000).material, false);
  assert.equal(variance(55000, 50000).material, false);
  assert.equal(variance(66000, 60000).material, false);
  assert.equal(variance(79000, 100000).material, true);
});
test("zero bases and signed balances are explicit", () => {
  assert.deepEqual(variance(6000, 0), { amount: 6000, percent: null, material: true });
  assert.deepEqual(variance(0, 0), { amount: 0, percent: 0, material: false });
  assert.equal(variance(-1200000, -1150000).percent, -50000 / 1150000 * 100);
});
test("YTD compares matching durations", () => {
  const result = computeVariances({ actual: 450000, budget: 400000, prior_month: 445000, prior_ytd: 1300000, ytd_actual: 1350000 });
  assert.equal(result[2].amount, 50000);
  assert.equal(result[2].material, false);
});
test("KPIs separate revenue from opex and handle missing denominators", () => {
  const result = kpis([{ account_category: "revenue", actual: 450000, budget: 400000, ytd_actual: 1350000 }, { account_category: "opex", actual: 95000, budget: 87000, ytd_actual: 282000 }], 15000000);
  assert.equal(result.revenue, 450000);
  assert.equal(result.profit, 355000);
  assert.equal(result.yield, 9);
  assert.equal(kpis([], 0).margin, null);
  assert.equal(kpis([], 0).yield, null);
});
