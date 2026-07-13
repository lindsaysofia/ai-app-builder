import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("build", "routes/build.tsx"),
  route("app/:appId", "routes/app.$appId.tsx"),
  route("api/apps", "routes/api.apps.ts"),
] satisfies RouteConfig;
