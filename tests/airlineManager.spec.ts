import { test } from '@playwright/test';
import { GeneralUtils } from '../utils/general.utils';
import { FuelUtils } from '../utils/fuel.utils';
import { CampaignUtils } from '../utils/campaign.utils';
import { FleetUtils } from '../utils/fleet.utils';
import { MaintenanceUtils } from '../utils/maintenance.utils';

require('dotenv').config();

const waitMin = parseInt(process.env.WAIT_AFTER_DEPART_MINUTES ?? '5', 10);
const extraMin = 2;
test.setTimeout((waitMin + extraMin) * 60 * 1000);

test('All Operations', async ({ page }) => {
  // Variable Initialization
  const fuelUtils = new FuelUtils(page);
  const generalUtils = new GeneralUtils(page);
  const campaignUtils = new CampaignUtils(page);
  const fleetUtils = new FleetUtils(page);
  const maintenanceUtils = new MaintenanceUtils(page);
  // End //

  // Login //
  await generalUtils.login(page);

  // Fuel Operations //
  await page.locator('#mapMaint > img').first().click();
  await fuelUtils.buyFuel();

  await page.getByRole('button', { name: ' Co2' }).click();
  await GeneralUtils.sleep(1000);
  await fuelUtils.buyCo2();

  await page.locator('#popup > .modal-dialog > .modal-content > .modal-header > div > .glyphicons').click();
  // End //

  // Campaign Operations //
  await page.locator('div:nth-child(5) > #mapMaint > img').click();
  await campaignUtils.createCampaign();

  await page.locator('#popup > .modal-dialog > .modal-content > .modal-header > div > .glyphicons').click();
  await GeneralUtils.sleep(1000)
  // End //

  // Repair Planes if needed //
  await page.locator('div:nth-child(4) > #mapMaint > img').click();
  
  await maintenanceUtils.checkPlanes();
  await GeneralUtils.sleep(1000);
  await maintenanceUtils.repairPlanes();
  await GeneralUtils.sleep(1000);

  await page.locator('#popup > .modal-dialog > .modal-content > .modal-header > div > .glyphicons').click();
  // End //

  // Depart Planes Operations //
  await page.locator('#mapRoutes').getByRole('img').click();
  await GeneralUtils.sleep(2500);

  await fleetUtils.departPlanes();
  // End //

  page.close();
});
