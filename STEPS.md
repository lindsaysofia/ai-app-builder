### Phase 1: The Skeleton
Initialize the Remix project with TypeScript
```
npx create-react-router@latest ai-app-builder // using instead of npx remix@next new because Remix v2 was upstreamed into React Router but Remiz v3 is a different framework
```

Create a PostgreSQL instance in Railway (we are using Railway since we'll need to run a Node server and host a PostgreSQL database and Railway does both)
1. Create an account in Railway
2. Create a new PostgresSQL instance, it'll be empty for now

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
```
