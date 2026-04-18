# Analytixx

## Production checklist

### BackEnd

- Set `NODE_ENV=production`.
- Set `FRONTEND_ORIGIN` to the deployed frontend URL.
- Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, and `SMTP_PASS` for email verification. Production signup now fails closed if SMTP is not configured.
- Set `TRUST_PROXY=1` when running behind Render, Caddy, or another reverse proxy.
- Set `COOKIE_DOMAIN` only if you want the auth cookie shared across subdomains.
- Use `CORS_ALLOWED_ORIGINS` for any extra allowed origins beyond `FRONTEND_ORIGIN`.
- Point `DATA_STORAGE_DIR` at persistent storage. Uploaded files and generated dataset artifacts should not live on ephemeral disk.
- Keep `DATABASE_URL` on persistent storage if you stay on SQLite. For multi-instance production, move to a managed database before scaling out.

### FrontEnd

- Set `BACKEND_ORIGIN` to the deployed backend URL so Next.js rewrites proxy `/api/*` correctly.
- Set all required `NEXT_PUBLIC_FIREBASE_*` values in the hosting platform.

### Deploy notes

- The backend startup script now tolerates a missing `.env` file and relies on platform-injected environment variables in production.
- The backend binds `0.0.0.0` automatically in production and shuts down cleanly on `SIGINT` and `SIGTERM`.
- Session cookies are now production-safe by default: `HttpOnly`, `SameSite=Lax`, `Secure` in production, and optional `Domain` support.
