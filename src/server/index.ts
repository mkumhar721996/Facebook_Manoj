import { createCheckoutServer } from './routes/couponRoutes.ts';

const DEMO_SUBTOTAL = 200;
const port = Number(process.env.PORT ?? 3000);

const server = createCheckoutServer(DEMO_SUBTOTAL);
server.listen(port, () => {
  console.log(`Checkout API listening on port ${port}`);
});
