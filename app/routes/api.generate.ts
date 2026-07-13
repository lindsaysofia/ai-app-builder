import Anthropic from "@anthropic-ai/sdk";
import type { Route } from "./+types/api.generate";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const META_PROMPT = `You are an expert at designing AI assistants for educational settings. 

A user will give you a plain English description of an AI app they want to build for students or educators. Your job is to decompose that description into a structured configuration with four fields:

1. **name**: A short, clear name for the app (2-5 words).

2. **background**: Who is this AI assistant? Define its role, personality, expertise, and tone. Be specific — don't just say "friendly assistant." Describe the persona as if you're writing a character brief. Include the grade level or audience if inferrable.

3. **workflow**: How should a conversation with this assistant go, step by step? What should it do first? How should it respond to different types of input? What's the ideal conversation arc? Write this as concrete instructions the AI can follow, not vague goals.

4. **guardrails**: What must this assistant NOT do? What topics should it redirect? What boundaries must it maintain? Always include these defaults for any student-facing app:
   - Never do homework or assignments for students; guide them instead
   - If a student expresses self-harm or crisis, respond with empathy and direct them to speak with a trusted adult or counselor
   - Keep all language age-appropriate
   - Stay on topic and gently redirect off-topic conversations
   - Never share personal opinions on politics, religion, or other sensitive topics
   Add any app-specific guardrails based on the description.

Respond with ONLY valid JSON in this exact format, no markdown fences, no explanation:
{"name": "...", "background": "...", "workflow": "...", "guardrails": "..."}`;

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { description } = await request.json();

  if (!description || typeof description !== "string") {
    return Response.json(
      { error: "Description is required" },
      { status: 400 }
    );
  }

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: META_PROMPT,
      messages: [{ role: "user", content: description }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    const parsed = JSON.parse(text);

    return Response.json({
      name: parsed.name,
      background: parsed.background,
      workflow: parsed.workflow,
      guardrails: parsed.guardrails,
    });
  } catch (error) {
    console.error("Generation failed:", error);
    return Response.json(
      { error: "Failed to generate app configuration" },
      { status: 500 }
    );
  }
}