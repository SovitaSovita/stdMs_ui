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

## How to check sync Translate file JSON
```bash
# 1. Check what's missing
npm run check-translations

# 2. Auto-add missing keys with [TRANSLATE] marker
npm run sync-translations

# 3. Open km.json and search for "[TRANSLATE]"
# Replace with actual Khmer translation

# 4. Check again
npm run check-translations

# Note: 'en' is Default Language. So all language must sync follow 'en'

```
