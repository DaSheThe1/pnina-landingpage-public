import { chromium } from "@playwright/test";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto("http://localhost:3006/"); await p.waitForTimeout(3000);
await p.screenshot({ path: "/tmp/claude-1000/-home-daniel-dev-pnina-website/4bcf817e-7606-453d-b5a1-ad5175b5581f/scratchpad/emoji.png" });
await b.close();
