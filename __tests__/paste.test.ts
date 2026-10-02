import test from "node:test";
import assert from "node:assert/strict";
import { parseIncomeRows } from "../lib/utils/paste.ts";
test("spreadsheet paste handles tabs, blanks, quoted thousands and negatives", () => {
 const rows = parseIncomeRows('account_name\tcategory\tactual\tbudget\tprior_month\tprior_ytd\tytd_actual\nRental\trevenue\t450000\t400000\t445000\t1300000\t1350000\n\n');
 assert.equal(rows[0].actual, 450000);
 assert.equal(parseIncomeRows('"Other, rent",revenue,"$6,000",0,(200),100,6000')[0].prior_month, -200);
});
test("bad financial input rejects the entire batch", () => {
 assert.throws(() => parseIncomeRows('Bad,revenue,garbage,0,0,0,0'), /invalid amount/);
 assert.throws(() => parseIncomeRows('Bad,unknown,1,2,3,4,5'), /category/);
 assert.throws(() => parseIncomeRows('Bad,revenue,1,2,3'), /7 columns/);
});
