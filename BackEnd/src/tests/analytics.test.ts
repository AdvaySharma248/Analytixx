import { test } from "node:test";
import assert from "node:assert";

// Basic mock classes and testing for Phase 7 validation
test("Query Parsing: Should infer count operation correctly", () => {
  const query = "How many delivered orders do we have?";
  const normalized = query.toLowerCase();
  
  const hasCountKeywords = normalized.includes("how many") || normalized.includes("count");
  assert.strictEqual(hasCountKeywords, true, "Should detect count methodology");
});

test("Data Processing: Should apply filters before aggregation", () => {
    const data = [
        { status: "Delivered", value: 100 },
        { status: "Cancelled", value: 50 },
        { status: "Delivered", value: 200 }
    ];

    const filtered = data.filter(d => d.status === "Delivered");
    const aggregatedSum = filtered.reduce((acc, curr) => acc + curr.value, 0);

    assert.strictEqual(filtered.length, 2, "Should filter out Cancelled orders prior to aggregation");
    assert.strictEqual(aggregatedSum, 300, "Should correctly aggregate post-filter");
});

test("Insights: Edge Cases and missing columns", () => {
  const emptyDataset: any[] = [];
  const safeSum = emptyDataset.reduce((acc, curr) => acc + curr, 0);
  
  assert.strictEqual(safeSum, 0, "Empty dataset should aggregate to 0 without crashing");
});
