import http from "node:http";
import { restaurants } from "./data/restaurants.js";
import { listRestaurants } from "./services/restaurantService.js";

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(body);
}

export function createMetrics() {
  return {
    requestCount: 0,
    errorCount: 0,
    totalDurationMs: 0,
  };
}

export function createServer({
  logger = console,
  metrics = createMetrics(),
  listRestaurantsImpl = listRestaurants,
} = {}) {
  return http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");

    if (req.method === "GET" && url.pathname === "/api/restaurants") {
      const startedAt = Date.now();
      const search = url.searchParams.get("search") || undefined;
      const cuisine = url.searchParams.get("cuisine") || undefined;
      const minRatingParam = url.searchParams.get("minRating");
      const maxDeliveryParam = url.searchParams.get("maxDeliveryMinutes");
      const minRating = minRatingParam !== null ? Number(minRatingParam) : undefined;
      const maxDeliveryMinutes =
        maxDeliveryParam !== null ? Number(maxDeliveryParam) : undefined;
      const filters = { search, cuisine, minRating, maxDeliveryMinutes };

      metrics.requestCount += 1;

      try {
        const result = listRestaurantsImpl(restaurants, filters);
        const durationMs = Date.now() - startedAt;
        metrics.totalDurationMs += durationMs;
        logger.info({ event: "http_request", path: url.pathname, filters, status: 200, durationMs });
        sendJson(res, 200, { restaurants: result });
      } catch (error) {
        const durationMs = Date.now() - startedAt;
        metrics.totalDurationMs += durationMs;
        metrics.errorCount += 1;
        logger.error({
          event: "http_request_error",
          path: url.pathname,
          filters,
          status: 500,
          durationMs,
          error: error.message,
        });
        sendJson(res, 500, { message: "Failed to load restaurants" });
      }
      return;
    }

    sendJson(res, 404, { message: "Not found" });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.ARC_DEV_PORT || 8008;
  const server = createServer();
  server.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}
