/* Stage 0 冒烟测试：页面渲染 + API 规则合成 + 文化护栏 */
const BASE = "http://localhost:3000";

async function main() {
  // 1. 页面渲染
  const page = await fetch(`${BASE}/design-interview`);
  const html = await page.text();
  console.log("[page] status:", page.status);
  console.log("[page] header copy:", html.includes("聊聊你自己"));
  console.log("[page] stage label:", html.includes("Guided"));

  // 2. API：完整答案（品类已知路径）
  const r1 = await fetch(`${BASE}/api/design-intent`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      answers: {
        occasion: ["everyday"],
        product_type: ["necklace"],
        style: ["minimal"],
        emotional_direction: ["calm"],
        visual_presence: ["subtle"],
        scale: ["small"],
        material_preference: ["matte"],
      },
    }),
  });
  const b1 = await r1.json();
  console.log("\n[api:known-product] status:", r1.status, "source:", b1.source);
  console.log("  intent:", JSON.stringify(b1.intent, null, 2));

  // 3. API：品类「还没想好」（探索路径：form_preference 出现，scale/weight 应缺省）
  const r2 = await fetch(`${BASE}/api/design-intent`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      answers: {
        occasion: ["gift"],
        product_type: ["unsure"],
        form_preference: ["organic"],
        style: ["nature"],
        emotional_direction: ["tenderness"],
        visual_presence: ["balanced"],
        material_preference: ["polished"],
      },
    }),
  });
  const b2 = await r2.json();
  console.log("\n[api:explore] status:", r2.status, "source:", b2.source);
  console.log("  product_type:", b2.intent?.product_type, "(应为 unknown)");
  console.log("  form_preference:", JSON.stringify(b2.intent?.form_preference));
  console.log("  weight:", b2.intent?.weight, "(未问体量应为 unknown)");

  // 4. API：全跳过（置信度最低 + fallback 文案）
  const r3 = await fetch(`${BASE}/api/design-intent`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ answers: { occasion: null, product_type: null } }),
  });
  const b3 = await r3.json();
  console.log("\n[api:all-skip] status:", r3.status);
  console.log("  confidence:", b3.intent?.confidence, "(应为低值)");
  console.log("  user_context:", b3.intent?.user_context);

  // 5. 非法输入 → 400
  const r4 = await fetch(`${BASE}/api/design-intent`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "not-json",
  });
  console.log("\n[api:invalid] status:", r4.status, "(应为 400)");
}

main().catch((e) => {
  console.error("SMOKE FAILED:", e.message);
  process.exit(1);
});
