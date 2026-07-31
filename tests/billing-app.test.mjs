import { describe, expect, it } from "vitest";
import { TestDriver } from "testdriverai/vitest/hooks";

// E-Invoice Billing App — https://github.com/shubhamsinghrajpurohit/e-in-voice-bi-ll-ing-
//
// Production (GitHub Pages) target. The site is a static, client-side React app
// backed by localStorage, so there is NO login — "fixtures" are the sample
// client/invoice data each test creates as it goes.
//
// NOTE: at the time these tests were written the production site's custom domain
// (kanott.work.gd, configured via the repo CNAME) returned ERR_EMPTY_RESPONSE,
// so the deployed app was unreachable. These tests are written against the real
// app UI and will pass once the site loads. If the custom domain stays broken,
// point PROD_URL at a working deployment (e.g. the GitHub Pages URL without the
// CNAME redirect, or a preview build).
const PROD_URL = "https://shubhamsinghrajpurohit.github.io/e-in-voice-bi-ll-ing-/";

describe("E-Invoice Billing App", () => {
  it("loads the dashboard", async (context) => {
    const testdriver = TestDriver(context);

    await testdriver.provision.chrome({ url: PROD_URL });

    // App boots through a brief "Loading ledger…" state before rendering.
    await testdriver.wait(4000);

    const dashboard = await testdriver.assert(
      "the billing app dashboard is visible, with a 'Dashboard' heading, summary stat cards (Collected, Outstanding, Overdue) and a 'New Invoice' button",
    );
    expect(dashboard).toBeTruthy();
  });

  it("navigates the sidebar to the Clients and Invoices views", async (context) => {
    const testdriver = TestDriver(context);

    await testdriver.provision.chrome({ url: PROD_URL });
    await testdriver.wait(4000);

    // Go to Clients
    const clientsNav = await testdriver.find("Clients navigation item in the sidebar");
    await clientsNav.click();
    await testdriver.wait(1500);
    const onClients = await testdriver.assert(
      "the Clients view is shown, with a 'Clients' heading, a 'Search clients…' box and an 'Add Client' button",
    );
    expect(onClients).toBeTruthy();

    // Go to Invoices
    const invoicesNav = await testdriver.find("Invoices navigation item in the sidebar");
    await invoicesNav.click();
    await testdriver.wait(1500);
    const onInvoices = await testdriver.assert(
      "the Invoices view is shown, with an 'Invoices' heading and a 'New Invoice' button",
    );
    expect(onInvoices).toBeTruthy();
  });

  it("adds a client through the Add Client modal", async (context) => {
    const testdriver = TestDriver(context);

    await testdriver.provision.chrome({ url: PROD_URL });
    await testdriver.wait(4000);

    // Open the Clients view
    const clientsNav = await testdriver.find("Clients navigation item in the sidebar");
    await clientsNav.click();
    await testdriver.wait(1500);

    // Open the Add Client modal
    const addClient = await testdriver.find("Add Client button");
    await addClient.click();
    await testdriver.wait(1000);

    const modalOpen = await testdriver.assert(
      "a client form/modal is open with a 'Save Client' button and Name / Email fields",
    );
    expect(modalOpen).toBeTruthy();

    // Fill in the Name field (required to enable Save Client)
    const nameField = await testdriver.find("Name input field in the client form");
    await nameField.click();
    await testdriver.type("Acme Corporation");

    // Fill in the Email field
    const emailField = await testdriver.find("Email input field in the client form");
    await emailField.click();
    await testdriver.type("billing@acme.example.com");

    // Save the client
    const save = await testdriver.find("Save Client button");
    await save.click();
    await testdriver.wait(1500);

    const saved = await testdriver.assert(
      "the new client 'Acme Corporation' now appears in the Clients list",
    );
    expect(saved).toBeTruthy();
  });
});
