// Checks docs/testing/TestingPlan.xlsx against the tests in the code, so the plan always lists every test:
//   - every test ID in the code (e.g. test('AUTH-002: ...')) has a row in the plan,
//   - every row in the plan has a test, unless its Execution Type says it is a CI step,
//   - no two tests share an ID.
// Run from the repository root: npm run test:plan
import { readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const TEST_FOLDERS = ["backend/test", "frontend/tests", "e2e"];
const TEST_FILE = /\.(test|integration|spec)\.(cjs|ts|tsx)$/;
// test('ID: ...') or describe("ID: ..."); a range such as 'JUNIOR-101..110' names a group, not a test.
const TEST_ID = /(?:test|describe)\(\s*(['"`])((?:[A-Z][A-Z0-9]*-)+\d{3})[: ]/g;

function testFiles(folder) {
  return readdirSync(folder).flatMap((name) => {
    if (name === "node_modules") return [];
    const path = join(folder, name);
    if (statSync(path).isDirectory()) return testFiles(path);
    return TEST_FILE.test(name) ? [path] : [];
  });
}

const inCode = new Map();
const duplicates = [];
for (const file of TEST_FOLDERS.flatMap(testFiles)) {
  for (const [, , id] of readFileSync(file, "utf8").matchAll(TEST_ID)) {
    if (inCode.has(id)) duplicates.push(`${id} (${inCode.get(id)} and ${file})`);
    else inCode.set(id, file);
  }
}

const rows = XLSX.utils.sheet_to_json(XLSX.readFile("docs/testing/TestingPlan.xlsx").Sheets.Sheet1, { header: 1, defval: "" });
const inPlan = new Map(rows.filter((row) => /^[A-Z][A-Z0-9-]*-\d{3}$/.test(String(row[1]))).map((row) => [String(row[1]), String(row[2])]));

const missing = [...inCode].filter(([id]) => !inPlan.has(id)).map(([id, file]) => `${id} (${file})`);
const stale = [...inPlan].filter(([id, run]) => !inCode.has(id) && !run.startsWith("CI")).map(([id]) => id);

const problems = [
  ...missing.map((item) => `Not in TestingPlan.xlsx: ${item}`),
  ...stale.map((id) => `In TestingPlan.xlsx but no test has this ID: ${id}`),
  ...duplicates.map((item) => `Two tests share the ID ${item}`),
];
if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`\n${problems.length} problem(s). Add a row to docs/testing/TestingPlan.xlsx for each new test (its ID, how to run it, what it checks), remove rows for deleted tests, and give each test its own ID.`);
  process.exit(1);
}
console.log(`Testing plan: all ${inCode.size} tests in the code are listed in TestingPlan.xlsx.`);
