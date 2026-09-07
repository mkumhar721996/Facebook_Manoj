import { test } from "node:test";
import assert from "node:assert/strict";
import { MenuPageController, renderMenuPage, GENERIC_ERROR_MESSAGE } from "./MenuPage.js";
import { getCounter, resetMetrics } from "../observability/metrics.js";

/** @type {import("../api/menuClient.js").MenuItem[]} */
const fixtureItems = [
  {
    id: "classic-cheeseburger",
    name: "Classic Cheeseburger",
    description: "Beef patty, cheddar, lettuce, tomato, and house sauce on a toasted bun.",
    price: 8.99,
    customisationOptions: [
      { name: "Bun type", choices: ["Sesame", "Brioche"] },
      { name: "Toppings", choices: ["Pickles", "Onions"] },
    ],
  },
  {
    id: "veggie-burger",
    name: "Veggie Burger",
    description: "Grilled plant-based patty with avocado and chipotle mayo.",
    price: 9.49,
    customisationOptions: [{ name: "Spice level", choices: ["Mild", "Hot"] }],
  },
];

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

test("AC1: renders all menu items with name, description, price, and customisation options once the fetch resolves", async () => {
  const client = { getMenu: async () => fixtureItems };
  const controller = new MenuPageController(client, "open-burger-shack");

  await controller.load();

  assert.equal(controller.state.status, "success");
  const html = renderMenuPage(controller.state);
  for (const item of fixtureItems) {
    assert.ok(html.includes(item.name), `expected html to include ${item.name}`);
    assert.ok(html.includes(item.description), `expected html to include ${item.description}`);
    assert.ok(html.includes(item.price.toFixed(2)), `expected html to include ${item.price}`);
    for (const option of item.customisationOptions) {
      assert.ok(html.includes(option.name), `expected html to include ${option.name}`);
      for (const choice of option.choices) {
        assert.ok(html.includes(choice), `expected html to include ${choice}`);
      }
    }
  }
});

test("AC2: shows a loading indicator while the menu fetch is pending, and hides it once resolved", async () => {
  const pending = deferred();
  const client = { getMenu: () => pending.promise };
  const controller = new MenuPageController(client, "open-burger-shack");

  const loadPromise = controller.load();

  assert.equal(controller.state.status, "loading");
  assert.ok(renderMenuPage(controller.state).includes('data-testid="menu-loading"'));

  pending.resolve(fixtureItems);
  await loadPromise;

  assert.equal(controller.state.status, "success");
  assert.ok(!renderMenuPage(controller.state).includes('data-testid="menu-loading"'));
});

test("renders a top-level heading in every state so screen reader users can establish page structure", async () => {
  const client = { getMenu: async () => fixtureItems };
  const controller = new MenuPageController(client, "open-burger-shack");

  assert.ok(renderMenuPage(controller.state).includes("<h1>Menu</h1>"), "loading state should include an h1");

  await controller.load();
  assert.ok(renderMenuPage(controller.state).includes("<h1>Menu</h1>"), "success state should include an h1");

  const failingController = new MenuPageController({ getMenu: async () => { throw new Error("boom"); } }, "open-burger-shack");
  await failingController.load();
  assert.ok(renderMenuPage(failingController.state).includes("<h1>Menu</h1>"), "error state should include an h1");
});

test("announces the error state to assistive technology via role=alert", async () => {
  const client = { getMenu: async () => { throw new Error("network error"); } };
  const controller = new MenuPageController(client, "open-burger-shack");

  await controller.load();

  assert.ok(renderMenuPage(controller.state).includes('role="alert"'));
});

test("logs the error and increments a failure counter when the menu fetch fails", async () => {
  resetMetrics();
  const logCalls = [];
  const client = { getMenu: async () => { throw new Error("network error"); } };
  const controller = new MenuPageController(client, "open-burger-shack", {
    logError: (message, fields) => logCalls.push({ message, fields }),
  });

  await controller.load();

  assert.equal(logCalls.length, 1);
  assert.equal(logCalls[0].fields.restaurantId, "open-burger-shack");
  assert.equal(logCalls[0].fields.error, "network error");
  assert.equal(getCounter("menu_load_failures_total"), 1);
});

test("AC3: shows a generic error message with a retry option when the fetch fails, and retrying re-fetches the menu", async () => {
  let shouldFail = true;
  const client = {
    getMenu: async () => {
      if (shouldFail) throw new Error("network error");
      return fixtureItems;
    },
  };
  const controller = new MenuPageController(client, "open-burger-shack");

  await controller.load();

  assert.equal(controller.state.status, "error");
  const errorHtml = renderMenuPage(controller.state);
  assert.ok(errorHtml.includes(GENERIC_ERROR_MESSAGE));
  assert.ok(errorHtml.includes('data-testid="menu-retry"'));

  shouldFail = false;
  await controller.retry();

  assert.equal(controller.state.status, "success");
  const successHtml = renderMenuPage(controller.state);
  assert.ok(successHtml.includes(fixtureItems[0].name));
});
