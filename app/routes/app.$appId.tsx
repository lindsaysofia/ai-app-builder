import { useLoaderData } from "react-router";
import { prisma } from "~/lib/db.server";
import type { Route } from "./+types/app.$appId";

export async function loader({ params }: Route.LoaderArgs) {
  const app = await prisma.app.findUnique({
    where: { id: params.appId },
  });

  if (!app) {
    throw new Response("App not found", { status: 404 });
  }

  return { app };
}

export default function AppPlayer() {
  const { app } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>{app.name}</h1>
      <pre>{JSON.stringify(app, null, 2)}</pre>
    </div>
  );
}