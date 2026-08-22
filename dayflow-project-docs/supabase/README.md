# Dayflow — Supabase

## Ownership

Member 1 is the owner of shared Supabase schema/auth/RLS.

Members 2–4 use the existing schema for their modules.

## Setup

1. Create one Supabase project.
2. Configure Auth.
3. Apply `schema.sql`.
4. Configure environment variables in the app.
5. Seed development data through a safe development-only mechanism.
6. Test RLS using both Admin and Employee accounts.

## Environment

Typical client variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Never commit service-role keys.

## Security

- Use RLS for protected tables.
- Do not trust frontend-only role checks.
- Keep service-role operations server-side.
- Use fake development data for the hackathon.

## Schema

See `schema.sql`.

The SQL is a foundation. If the existing project already has a compatible schema, do not blindly replace it; reconcile changes first.
