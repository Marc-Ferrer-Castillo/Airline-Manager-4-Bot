import { Page } from "@playwright/test";
import { GeneralUtils } from "./general.utils";

require('dotenv').config();

export class FleetUtils {
  page: Page;
  maxTry: number; // avoid infinite loops on initial scan

  private waitAfterDepartMs: number;
  private pollIntervalMs: number;

  constructor(page: Page) {
    this.page = page;
    this.maxTry = 8;

    const waitMin = parseInt(process.env.WAIT_AFTER_DEPART_MINUTES ?? '5', 10);
    this.waitAfterDepartMs = waitMin * 60_000;
    this.pollIntervalMs = parseInt(process.env.DEPART_POLL_MS ?? '15000', 10);

    console.log(`Depart wait window: ${waitMin} min, poll: ${this.pollIntervalMs} ms`);
  }

  // Read the snackbar number from "Departed" for this click.
  private async readDepartSnackbarCount(): Promise<number | null> {
    const el = this.page.locator('#fd_routes');
    try {
      await el.waitFor({ state: 'visible', timeout: 4000 });
      const raw = await el.innerText();
      const n = parseInt(raw.replace(/[^\d]/g, ''), 10);
      return Number.isFinite(n) ? n : null;
    } catch {
      return null; 
    }
  }

  private async clickDepartAllAndLogOnce(): Promise<void> {
    await this.page.locator('button:has(#listDepartAmount), button:has-text("Depart all"), button:has-text("Depart")').first().click();
    
    await GeneralUtils.sleep(1500);

    // if there is a blockage (fuel/maint), there will be no real departures
    const cantDepartPlane = await this.page
      .getByText('×Unable to departSome A/C was')
      .isVisible()
      .catch(() => false);

    if (cantDepartPlane) {
      console.log('⚠️ Some aircraft cannot depart now (fuel/maint/crew).');
      return;
    }

    const count = await this.readDepartSnackbarCount();
    if (count === null) {
      console.log('ℹ️ Depart clicked, but no snackbar count visible.');
    } else {
      console.log(`✈️ Departed ${count} plane(s) in this click.`);
    }
  }

  public async departPlanes() {
    console.log('Looking if there are any planes to be departed...');

    // 1) Quick sweep
    let departAllVisible = await this.page.locator('button:has(#listDepartAmount), button:has-text("Depart all"), button:has-text("Depart")').first().isVisible();
    let count = 0;

    while (departAllVisible && count < this.maxTry) {
      console.log('Departing...');
      await this.clickDepartAllAndLogOnce();

      departAllVisible = await this.page.locator('button:has(#listDepartAmount), button:has-text("Depart all"), button:has-text("Depart")').first().isVisible();
      count++;
    }

    // 2) Waiting window for planes arriving in the next few minutes
    if (this.waitAfterDepartMs > 0) {
      const deadline = Date.now() + this.waitAfterDepartMs;
      console.log(`Entering post-depart watch window for up to ${this.waitAfterDepartMs / 60000} minutes...`);

      while (Date.now() < deadline) {
        await GeneralUtils.sleep(1500);
        const visible = await this.page.locator('button:has(#listDepartAmount), button:has-text("Depart all"), button:has-text("Depart")').first().isVisible().catch(() => false);

        if (visible) {
          console.log('New arrivals ready. Departing batch...');
          await this.clickDepartAllAndLogOnce();
        } else {
          console.log('No planes ready. Waiting...');
        }

        await GeneralUtils.sleep(this.pollIntervalMs);
        await this.page.reload({ waitUntil: 'domcontentloaded' });        
      }
      console.log('Watch window finished.');
    }
  }
}
