import worker from "./worker.bundle.js";

export const config = {
  route: "/*",
  runtime: "edge",
};

export async function onRequest(context) {
  const { request, env } = context;
  return worker.fetch
    ? worker.fetch(request, env, context)
    : worker(request, env, context);
}
