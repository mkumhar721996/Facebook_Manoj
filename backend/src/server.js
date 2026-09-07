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

export function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");

    if (req.method === "GET" && url.pathname === "/api/restaurants") {
      const search = url.searchParams.get("search") || undefined;
      const cuisine = url.searchParams.get("cuisine") || undefined;
      const minRatingParam = url.searchParams.get("minRating");
      const maxDeliveryParam = url.searchParams.get("maxDeliveryMinutes");
      const minRating = minRatingParam !== null ? Number(minRatingParam) : undefined;
      const maxDeliveryMinutes =
        maxDeliveryParam !== null ? Number(maxDeliveryParam) : undefined;

      const result = listRestaurants(restaurants, {
        search,
        cuisine,
        minRating,
        maxDeliveryMinutes,
      });
      sendJson(res, 200, { restaurants: result });
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
