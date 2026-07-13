import { prisma } from "~/lib/db.server";
import type { Route } from "./+types/api.apps";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await request.json();

  const app = await prisma.app.create({
    data: {
      name: body.name,
      description: body.description,
      background: body.background,
      workflow: body.workflow,
      guardrails: body.guardrails,
      referenceMaterial: body.referenceMaterial || null,
    },
  });

  return Response.json({ id: app.id });
}