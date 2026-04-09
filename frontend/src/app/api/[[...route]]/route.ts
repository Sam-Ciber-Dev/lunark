import { Hono } from "hono";
import { handle } from "hono/vercel";
import app from "@lunark/api/app";

// Mount the Hono API under /api so routes resolve correctly
// e.g. /api/products → app handles /products
const handler = new Hono();
handler.route("/api", app);

export const GET = handle(handler);
export const POST = handle(handler);
export const PUT = handle(handler);
export const PATCH = handle(handler);
export const DELETE = handle(handler);
