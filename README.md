<img src="./public/misbah-logo-dark.svg" alt="Misbah Logo" width="300"/>

## Overview!

Misbah is a web application designed for searching and exploring a collection of Hadiths. It provides a user-friendly interface to query the database and view relevant Hadith texts.

## Getting Started

First, set up your environment variables (e.g., for Supabase). Refer to `.env.example` if available (create one if needed).

Then, run the development server:

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

## Database Setup

This project uses Supabase. Ensure you have a Supabase project set up and the necessary database migrations applied (see the `supabase/` directory).

Run the ingestion script if needed to populate data:

```bash
npm run ingest
# or equivalent based on your package manager
```
