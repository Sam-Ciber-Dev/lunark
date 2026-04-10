import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { categories } from "../db/schema";

const categoriesRouter = new Hono();

// GET /categories — list all categories (with hierarchy)
categoriesRouter.get("/", async (c) => {
  const gender = c.req.query("gender");

  let rows;
  if (gender) {
    rows = await db
      .select()
      .from(categories)
      .where(eq(categories.gender, gender))
      .orderBy(categories.position);
  } else {
    rows = await db.select().from(categories).orderBy(categories.position);
  }

  return c.json({ data: rows });
});

export { categoriesRouter };
