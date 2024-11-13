import { Hono } from "hono";
import { getConnInfo } from 'hono/deno'

const app = new Hono();

app.get("/", async (c) => {
  const { remote: { address } } = await getConnInfo(c);
  const ip = address ?? 'Unknown';

  const accept = c.req.header("accept");

  if (accept === "application/json") {
    return c.json({ ip, hello: "world" });
  }

  return c.text(ip);
});

app.get("/dns/:name", async (c) => {
  let name = c.req.param("name");

  if (!name.endsWith(".")) {
    name += "."
  }

  const [A, AAAA, CNAME, TXT, MX, NS] = await Promise.allSettled([
    Deno.resolveDns(name, "A"),
    Deno.resolveDns(name, "AAAA"),
    Deno.resolveDns(name, "CNAME"),
    Deno.resolveDns(name, "TXT"),
    Deno.resolveDns(name, "MX"),
    Deno.resolveDns(name, "NS"),
  ]);

  const obj: Record<string, PromiseSettledResult<string[] | string[][] | Deno.MxRecord[]>> = {
    A,
    AAAA,
    CNAME,
    TXT,
    MX,
    NS,
  };

  type RecordType = string | Deno.MxRecord;

  const newObj: Record<string, RecordType | RecordType[]> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value.status === "fulfilled") {
      if (Array.isArray(value.value)) {
        if (value.value.length === 0) {
          continue
        } else if (value.value.length === 1) {
          if (Array.isArray(value.value[0])) {
            newObj[key] = value.value[0];
          } else {
            newObj[key] = value.value[0];
          }
        } else {
          if (Array.isArray(value.value)) {
            newObj[key] = value.value.flat();
          } else {
            newObj[key] = value.value;
          }
        }
      }
    }
  }

  return c.json(newObj);
})

Deno.serve(app.fetch);
