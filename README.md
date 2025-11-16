This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deploy on Cloudflare Workers (SSR)

This project is now wrapped with [OpenNext](https://github.com/cloudflare/open-next) so it can run as a Server-Side Rendered Cloudflare Worker.

1. Set up your Cloudflare credentials by running `wrangler login` and filling in `account_id` (or the `route`/`zone_id` you plan to target) inside `wrangler.toml`.
2. Install dependencies (including `@opennextjs/cloudflare` and `wrangler`) with `npm install`.
3. Build the Next.js app and package it for Workers:

```bash
npm run build
npm run build:cloudflare
```

4. Publish the worker:

```bash
npm run deploy:cloudflare
```

Use `npm run dev:cloudflare` to preview the worker locally via `wrangler dev`, and edit `open-next.config.mjs` if you need to customize how OpenNext processes the `src` directory or rewrites routes. The generated worker bundle (the `worker.js` entrypoint plus assets) lives in `.open-next/`, which is ignored via `.gitignore`.

Cloudflare Pages ships that worker as a Pages Function defined in `functions/worker.js`, which re-exports the generated `worker.js` and declares the `route: "/*"`/`runtime: "edge"` config that Pages needs to wire it in. The `npm run build:cloudflare` step (via `opennextjs-cloudflare build --openNextConfigPath open-next.config.mjs`) now copies the entire `.open-next/` output into `functions/.open-next/` and places `functions/worker.js` alongside it, keeping all worker-relative assets (images, skew protection, middleware, durable objects, etc.) resolvable during the Pages Function build. This copy occurs automatically via the new `postbuild:cloudflare` script. Once both the copy and `functions/worker.js` are in place, the preview domain (`*.pages.dev`) will start serving your SSR app instead of static 404s.

Cloudflare Pages deploys this project using the minimal `wrangler.toml` (Pages honors `pages_build_output_dir`, so it knows where the OpenNext bundle lives). For direct `wrangler dev` or manual `wrangler publish` workflows you can keep using `npm run dev:cloudflare`/`npm run deploy:cloudflare`, which target the supplementary `wrangler.dev.toml` (it sets `main`, `workers_dev`, and the build command so you get the same bundle locally). Fill in `account_id`/`route` there when you need to publish to your own zone.
