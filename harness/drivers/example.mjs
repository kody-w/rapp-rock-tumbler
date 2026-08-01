// A driver receives the Playwright page after load + settle.
// Get past the start gate FIRST — half of all bad captures are a splash screen.
export default async function drive(page) {
  const hold = async (keys, ms) => {
    for (const k of keys) await page.keyboard.down(k);
    await page.waitForTimeout(ms);
    for (const k of keys) await page.keyboard.up(k);
  };
  // Prefer a stable id over text. Text matching silently picks the wrong node.
  await page.locator('#btnStart').click({ timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.mouse.move(640, 360);
  await hold(['KeyW'], 2600);
  await hold(['KeyW', 'ShiftLeft'], 2400);
}
