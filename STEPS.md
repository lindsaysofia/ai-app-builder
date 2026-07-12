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