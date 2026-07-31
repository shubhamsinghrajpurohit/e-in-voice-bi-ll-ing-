import { describe, expect, it } from "vitest";
import { TestDriver } from "testdriverai/vitest/hooks";

/**
 * Sample TestDriver tests for the E-Invoice Billing App.
 *
 * NOTE ON TARGET URL
 * ------------------
 * The issue asked us to target the production environment
 * (https://shubhamsinghrajpurohit.github.io/e-in-voice-bi-ll-ing-/). At the time
 * these tests were written that URL 301-redirects to the configured custom domain
 * `http://kanott.work.gd/`, which returns ERR_EMPTY_RESPONSE — production is
 * currently unreachable (see the PR description for details).
 *
 * So that these sample tests actually run (locally and in CI), they target a
 * self-contained build of the SAME app, produced from `billing-app.zip` in this
 * repo and served via raw.githack.com from this branch. Once production is fixed,
 * point APP_URL at the production URL and the tests should pass unchanged — the
 * app is 100% client-side (localStorage), no login required.
 */
const APP_URL =
  process.env.APP_URL ||
  "https://raw.githack.com/shubhamsinghrajpurohit/e-in-voice-bi-ll-ing-/testdriver/sample-tests/e2e/fixtures/billing-app.html";

describe("E-Invoice Billing App", () => {
  it("loads the dashboard", async (context) => {
    const testdriver = TestDriver(context);

    await testdriver.provision.chrome({ url: APP_URL });

    // The app boots into the Dashboard view.
    const dashboardVisible = await testdriver.assert(
      "the Dashboard heading is visible along with the Collected, Outstanding and Overdue summary cards",
    );
    expect(dashboardVisible).toBeTruthy();
  });

  it("adds a new client", async (context) => {
    const testdriver = TestDriver(context);

    await testdriver.provision.chrome({ url: APP_URL });

    // Go to the Clients section.
    const clientsNav = await testdriver.find("the Clients navigation item in the sidebar");
    await clientsNav.click();
    await testdriver.wait(1500);

    // Open the Add Client modal.
    const addClient = await testdriver.find("the Add Client button");
    await addClient.click();
    await testdriver.wait(1000);

    // Fill in the client's name (the only required field).
    const nameField = await testdriver.find("the Name input field in the Add Client dialog");
    await nameField.click();
    await testdriver.type("Acme Corp");

    // Save the client.
    const saveClient = await testdriver.find("the Save Client button");
    await saveClient.click();
    await testdriver.wait(1500);

    const clientAdded = await testdriver.assert(
      "a client named 'Acme Corp' now appears in the clients list",
    );
    expect(clientAdded).toBeTruthy();
  });

  it("opens the new invoice form", async (context) => {
    const testdriver = TestDriver(context);

    await testdriver.provision.chrome({ url: APP_URL });

    // From the dashboard, start a new invoice.
    const newInvoice = await testdriver.find("the New Invoice button");
    await newInvoice.click();
    await testdriver.wait(1500);

    const formVisible = await testdriver.assert(
      "an invoice creation/editing form is visible with fields for invoice line items",
    );
    expect(formVisible).toBeTruthy();
  });
});
