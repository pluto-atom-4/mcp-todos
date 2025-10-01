import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { PrismaClient } from "../generated/prisma/index.js";

const app = new Hono();
const prisma = new PrismaClient();

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get("/systems/ping", (c) => {
  return c.json({ message: "pong" });
});

app.get("/todos", async (c) => {
  const todos = await prisma.todo.findMany();
  return c.json(todos);
});


serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
