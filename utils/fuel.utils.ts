import { Page } from "@playwright/test";

require('dotenv').config();

export class FuelUtils {
    maxFuelPrice : number;
    maxCo2Price : number;

    page : Page;

    constructor(page : Page) {
        this.maxFuelPrice = parseInt(process.env.MAX_FUEL_PRICE!);
        this.maxCo2Price = parseInt(process.env.MAX_CO2_PRICE!);
        this.page = page;

        console.log("Max Fuel Price: " + this.maxFuelPrice);
        console.log("Max Co2 Price: " + this.maxCo2Price);
    }

    public async buyFuel() {
        console.log('Buying Fuel...');

        const getCurrentFuelPrice = async () => {
            let fuelText = await this.page.getByText('Total price$').locator('b > span').innerText();
            fuelText = fuelText.replaceAll(',', '');
            return parseInt(fuelText);
        };

        const getEmptyFuel = async () => {
            const emptyText = (await this.page.locator('#remCapacity').innerText()).replaceAll(',', '');
            return parseInt(emptyText);
        };

        const emptyFuel = await getEmptyFuel();
        if (emptyFuel === 0) {
            console.log('Fuel tank is full. Skipping purchase.');
            return;
        }

        const curFuelPrice = await getCurrentFuelPrice();
        console.log('Current Fuel Price: ' + curFuelPrice);

        // Buy fuel if current price is lower than max price (fill remaining capacity)
        if (curFuelPrice < this.maxFuelPrice) {
            const emptyFuelCapacity = (await this.page.locator('#remCapacity').innerText()).replaceAll(',', '');

            await this.page.getByPlaceholder('Amount to purchase').click();
            await this.page.getByPlaceholder('Amount to purchase').press('Control+a');
            await this.page.getByPlaceholder('Amount to purchase').fill(emptyFuelCapacity);
            await this.page.getByRole('button', { name: ' Purchase' }).click();

            console.log('Bought Fuel Successfully! Amount of fuel bought: ' + emptyFuelCapacity + ' Litres');
        } else {
            console.log('Fuel price is above max. Skipping purchase.');
        }
    }

    public async buyCo2() {
        const getCurrentCo2Price = async () => {
            let co2Text = await this.page.getByText('Total price$').locator('b > span').innerText();
            co2Text = co2Text.replaceAll(',', '');
            return parseInt(co2Text);
        };

        const getEmptyCO2 = async () => {
            const emptyText = (await this.page.locator('#remCapacity').innerText()).replaceAll(',', '');
            return parseInt(emptyText);
        };

        const emptyCo2 = await getEmptyCO2();
        if (emptyCo2 === 0) {
            console.log('CO2 storage is full. Skipping purchase.');
            return;
        }

        const curCo2Price = await getCurrentCo2Price();
        console.log('Current Co2 Price: ' + curCo2Price);

        // Buy CO2 if current price is lower than max price (fill remaining capacity)
        if (curCo2Price < this.maxCo2Price) {
            const emptyCo2Capacity = (await this.page.locator('#remCapacity').innerText()).replaceAll(',', '');

            await this.page.getByPlaceholder('Amount to purchase').click();
            await this.page.getByPlaceholder('Amount to purchase').press('Control+a');
            await this.page.getByPlaceholder('Amount to purchase').fill(emptyCo2Capacity);
            await this.page.getByRole('button', { name: ' Purchase' }).click();

            console.log('Bought Co2 Successfully! Amount of co2 bought: ' + emptyCo2Capacity);
        } else {
            console.log('CO2 price is above max. Skipping purchase.');
        }
    }
}
