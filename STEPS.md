### Phase 1: The Skeleton
Initialize the Remix project with TypeScript
```
npx create-react-router@latest ai-app-builder // using instead of npx remix@next new because Remix v2 was upstreamed into React Router but Remiz v3 is a different framework
```

Create a PostgreSQL instance in Railway (we are using Railway since we'll need to run a Node server and host a PostgreSQL database and Railway does both)
1. Create an account in Railway
2. Create a new PostgresSQL instance. It'll be empty for now

Set up a query layer with Prisma (Prisma gives us type safety, migrations, and it's commonly used with Remix/TypeScript)
1. Install Prisma
```
npm install prisma @prisma/client
npx prisma init
```
Update your .env file to include the following
```
DATABASE_URL="your DATABASE_PUBLIC_URL from Railway"
```

Add the following to your prisma/schema.prisma file
```
model App {
  id                String   @id @default(cuid())
  name              String
  description       String
  background        String
  workflow          String
  guardrails        String
  referenceMaterial String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```
Run the following - no need to have Remix running
```
npx prisma migrate dev --name init
npx prisma generate
npm install @prisma/adapter-pg
```

Create app/lib/db.server.ts
```
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

let prisma: PrismaClient;

declare global {
  var __db__: PrismaClient | undefined;
}

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({ adapter });
} else {
  if (!global.__db__) {
    global.__db__ = new PrismaClient({ adapter });
  }
  prisma = global.__db__;
}

export { prisma };
```
Create the following three new route files
app/routes/build.tsx
```
export default function Build() {
  return (
    <div>
      <h1>Build Your App</h1>
    </div>
  );
}
```
app/routes/app.$appId.tsx
```
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
```
app/routes/api.apps.ts
```
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
```

Update app/routes.ts
```
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("build", "routes/build.tsx"),
  route("app/:appId", "routes/app.$appId.tsx"),
  route("api/apps", "routes/api.apps.ts"),
] satisfies RouteConfig;
```

Make sure your app is running (npm run dev) and test that you can access the /build route

Test the database connection. Run the following in your terminal
```
curl -X POST http://localhost:5173/api/apps \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test App",
    "description": "A friendly test app",
    "background": "You are a helpful assistant.",
    "workflow": "Greet the user and ask how you can help.",
    "guardrails": "Keep responses appropriate for students."
  }'
```
It should return an id. Verify you can access http://localhost:5173/app/THAT_ID

### Phase 2: The Builder Flow
Install the Anthropic SDK
```
npm install @anthropic-ai/sdk
```
Add your Anthropic API key to .env
```
ANTHROPIC_API_KEY="your-key-here"
```
Create app/routes/api.generate.ts and update app.routes.ts to include it
Update app/routes/build.tsx to show two different stages: First, a description form. Then, editable prompt fields

Navigate to /build and verify you are able to generate a prompt, and create a shareable link

### Phase 3: Create Live Conversations with the Configured AI Assistant

Create app/routes/api.chat.ts and update app.routes.ts to include it
