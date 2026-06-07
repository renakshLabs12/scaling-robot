#!/usr/bin/env node
// playwright-runner.js
// Runs automation steps from $STEPS_JSON and saves results + screenshots.

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  const stepsEnv = process.env.STEPS_JSON;
  if (!stepsEnv) {
    console.error('ERROR: STEPS_JSON environment variable not set');
    process.exit(1);
  }

  let payload;
  try {
    payload = JSON.parse(stepsEnv);
  } catch (e) {
    console.error('ERROR: Failed to parse STEPS_JSON:', e.message);
    process.exit(1);
  }

  const steps = payload.steps || payload;
  const startUrl = payload.startUrl || 'about:blank';

  console.log(`\n🎭 Playwright Automation Runner`);
  console.log(`📋 Steps to execute: ${steps.length}`);
  console.log(`🌐 Starting URL: ${startUrl}\n`);

  // Create output directory
  const outDir = path.join(process.cwd(), 'results');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();
  const results = [];

  // Navigate to start URL first if not covered by steps
  const hasNavStep = steps.some(s => s.action === 'navigate');
  if (!hasNavStep && startUrl !== 'about:blank') {
    try {
      console.log(`  → Navigating to ${startUrl}`);
      await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await sleep(1000);
    } catch (e) {
      console.warn(`  ⚠ Initial navigation warning: ${e.message}`);
    }
  }

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepNum = i + 1;
    console.log(`\nStep ${stepNum}/${steps.length}: [${step.action}] ${step.description}`);

    const result = {
      stepNumber: stepNum,
      description: step.description,
      action: step.action,
      selector: step.selector,
      value: step.value,
      success: false,
      error: null,
      screenshot: null
    };

    try {
      switch (step.action) {
        case 'navigate': {
          const navUrl = step.value || startUrl;
          console.log(`  → goto: ${navUrl}`);
          await page.goto(navUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await sleep(1200);
          result.success = true;
          break;
        }

        case 'click': {
          console.log(`  → click: ${step.selector}`);
          await page.waitForSelector(step.selector, { timeout: 10000, state: 'visible' });
          await page.click(step.selector);
          await sleep(800);
          result.success = true;
          break;
        }

        case 'fill': {
          console.log(`  → fill: ${step.selector} = "${step.value}"`);
          await page.waitForSelector(step.selector, { timeout: 10000, state: 'visible' });
          await page.fill(step.selector, step.value || '');
          await sleep(400);
          result.success = true;
          break;
        }

        case 'press': {
          const key = step.value || 'Enter';
          if (step.selector) {
            console.log(`  → press: ${key} on ${step.selector}`);
            await page.press(step.selector, key);
          } else {
            console.log(`  → press: ${key}`);
            await page.keyboard.press(key);
          }
          await sleep(1000);
          result.success = true;
          break;
        }

        case 'wait': {
          const ms = parseInt(step.value) || 2000;
          console.log(`  → wait: ${ms}ms`);
          await sleep(ms);
          result.success = true;
          break;
        }

        case 'screenshot': {
          console.log(`  → screenshot only`);
          result.success = true;
          break;
        }

        case 'scroll': {
          console.log(`  → scroll`);
          await page.evaluate(() => window.scrollBy(0, 400));
          await sleep(500);
          result.success = true;
          break;
        }

        case 'hover': {
          if (step.selector) {
            console.log(`  → hover: ${step.selector}`);
            await page.hover(step.selector, { timeout: 8000 });
            await sleep(500);
          }
          result.success = true;
          break;
        }

        case 'select': {
          console.log(`  → select: ${step.selector} = "${step.value}"`);
          await page.selectOption(step.selector, step.value || '');
          await sleep(400);
          result.success = true;
          break;
        }

        default:
          console.warn(`  ⚠ Unknown action: ${step.action}`);
          result.success = true;
      }

      // Wait for any navigation
      try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
      } catch (_) { /* ok */ }

    } catch (err) {
      console.error(`  ✕ Error: ${err.message}`);
      result.success = false;
      result.error = err.message;
    }

    // Always take screenshot after each step
    try {
      const screenshotPath = path.join(outDir, `step-${stepNum}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: false,
        type: 'png'
      });
      const buf = fs.readFileSync(screenshotPath);
      result.screenshot = buf.toString('base64');
      console.log(`  📸 Screenshot saved: step-${stepNum}.png`);
    } catch (err) {
      console.warn(`  ⚠ Screenshot failed: ${err.message}`);
    }

    results.push(result);
  }

  await browser.close();

  // Save results.json
  const resultsJson = { steps: results, totalSteps: steps.length, completedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(resultsJson, null, 2));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`\n✅ Done. ${passed} passed, ${failed} failed.`);
  console.log(`📁 Results saved to: ${outDir}/`);

  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
