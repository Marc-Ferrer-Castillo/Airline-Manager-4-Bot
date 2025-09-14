import { Page } from "@playwright/test";

require('dotenv').config();

export class GeneralUtils {
    username : string;
    password : string;
    page : Page;

    constructor(page : Page) {
        this.username = process.env.EMAIL!;
        this.password = process.env.PASSWORD!;
        this.page = page;
    }

    public static async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public async login(page: Page) {
        console.log('Logging in...')

        await page.goto('https://www.airlinemanager.com/');

        await page.getByRole('button', { name: 'PLAY FREE NOW' }).click();
        await page.getByRole('button', { name: 'Log in' }).click();
        await page.locator('#lEmail').click();
        await page.locator('#lEmail').fill(this.username);
        await page.locator('#lEmail').press('Tab');
        await page.locator('#lPass').click();
        await page.locator('#lPass').fill(this.password);
        await page.getByRole('button', { name: 'Log In', exact: true }).click();

        await page.waitForLoadState('networkidle');              // ensure cookies/session are set
        await page.reload({ waitUntil: 'networkidle' });         // hard refresh so app initializes as logged-in
        
        console.log('Logged in successfully!');
    }
}
