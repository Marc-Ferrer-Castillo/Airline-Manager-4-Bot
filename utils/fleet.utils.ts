import { Page } from "@playwright/test";
import { GeneralUtils } from "./general.utils";

require('dotenv').config();

export class FleetUtils {
    page: Page;
    maxTry: number; // evita bucles infinitos en el barrido inicial

    private waitAfterDepartMs: number;
    private pollIntervalMs: number;

    constructor(page: Page) {
        this.page = page;
        this.maxTry = 8; // mantiene tu comportamiento actual

        // Config .env (optional)
        const waitMin = parseInt(process.env.WAIT_AFTER_DEPART_MINUTES ?? '5', 10);
        this.waitAfterDepartMs = waitMin * 60_000;
        this.pollIntervalMs = parseInt(process.env.DEPART_POLL_MS ?? '15000', 10);

        console.log(`Depart wait window: ${waitMin} min, poll: ${this.pollIntervalMs} ms`);
    }

    public async departPlanes() {
        console.log('Looking if there are any planes to be departed...');

        // 1) Fast first departure
        let departAllVisible = await this.page.locator('#departAll').isVisible();
        let count = 0;

        while (departAllVisible && count < this.maxTry) {
            console.log('Departing 20 or less...');
            const departAll = this.page.locator('#departAll');
            await departAll.click();
            await GeneralUtils.sleep(1500);

            const cantDepartPlane = await this.page.getByText('×Unable to departSome A/C was').isVisible();
            if (cantDepartPlane) break;

            departAllVisible = await this.page.locator('#departAll').isVisible();
            count++;
            console.log('Departed 20 or less planes...');
        }

        // 2) Watch window (up to 5 min by default) for aircraft arriving shortly after
        if (this.waitAfterDepartMs > 0) {
            const deadline = Date.now() + this.waitAfterDepartMs;
            console.log(`Entering post-depart watch window for up to ${this.waitAfterDepartMs / 60000} minutes...`);

            while (Date.now() < deadline) {
                // Check for available departures
                const visible = await this.page.locator('#departAll').isVisible();

                if (visible) {
                    console.log('New arrivals ready. Departing batch...');
                    await this.page.locator('#departAll').click();
                    await GeneralUtils.sleep(1500);

                    const cantDepartPlane = await this.page.getByText('×Unable to departSome A/C was').isVisible();
                    if (cantDepartPlane) {
                        console.log('Some aircraft cannot depart now (fuel/maint/crew). Will retry on next poll.');
                    }
                } else {
                    console.log('No planes ready. Waiting...');
                }

                // Pequeña pausa y refresh suave para que la UI actualice estados
                await GeneralUtils.sleep(this.pollIntervalMs);
                await this.page.reload({ waitUntil: 'domcontentloaded' });
                await GeneralUtils.sleep(500);
            }

            console.log('Watch window finished.');
        }
    }
}
