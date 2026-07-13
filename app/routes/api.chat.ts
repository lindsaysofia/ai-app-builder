import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "~/lib/db.server";
import type { Route } from "./+types/api.chat";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { appId, messages } = await request.json();

  const app = await prisma.app.findUnique({ where: { id: appId } });
  if (!app) {
    return Response.json({ error: "App not found" }, { status: 404 });
  }

  const systemPrompt = [
    app.background,
    "",
    "## Workflow",
    app.workflow,
    "",
    "## Guardrails",
    app.guardrails,
    app.referenceMaterial
      ? `\n## Reference Material\nUse the following reference material to ground your responses:\n${app.referenceMaterial}`
      : "",
  ].join("\n");

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return Response.json({ reply: text });
  } catch (error) {
    console.error("Chat error:", error);
    return Response.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}