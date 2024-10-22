import { Hono } from "hono";
import { getConnInfo } from 'hono/deno'

const app = new Hono();

app.get("/", (c) => {
  return c.text("There's nothing here...try `/ip`");
});

app.get("/ip", async (c) => {
  const { remote: { address } } = await getConnInfo(c);
  const ip = address ?? 'Unknown';

  const accept = c.req.header("accept");

  if (accept === "application/json") {
    return c.json({ ip });
  }

  return c.text(ip);
});

Deno.serve(app.fetch);
