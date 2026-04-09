import { Hono } from "hono";
import { db } from "../db";
import { categories } from "../db/schema";

const categoriesRouter = new Hono();

// GET /categories — list all categories
categoriesRouter.get("/", async (c) => {
  const rows = await db.select().from(categories).orderBy(categories.name);
  return c.json({ data: rows });
});

export { categoriesRouter };
