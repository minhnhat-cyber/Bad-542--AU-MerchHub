# Production Deployment

Replace `YOUR_DOMAIN` below with the real domain. The target Linux server needs
Docker Engine, the Docker Compose plugin, Nginx, and Certbot.

## 1. Azure Key Vault

Create these exact secret names in the class Key Vault:

| Secret | Value |
| --- | --- |
| `database-url` | Production MySQL connection string |
| `app-jwt-secret` | Random value of at least 32 characters |
| `gemini-api-key` | Gemini API key |

Grant the deployment identity only the Key Vault Secrets User role. Prefer a
managed identity when the host supports it. If the class provides a service
principal, inject its Azure credential variables through the host/service
manager, not through a committed file.

## 2. Non-secret deployment configuration

Set these variables in the deployment shell or CI secret/configuration store:

```text
KEY_VAULT_URL=https://nhatminh-backend-kv-2026.vault.azure.net/
MICROSOFT_TENANT_ID=...
MICROSOFT_CLIENT_ID=...
MICROSOFT_ALLOWED_EMAIL_DOMAIN=...
CORS_ORIGINS=https://YOUR_DOMAIN
```

If the VPS is outside Azure, also provide `AZURE_TENANT_ID`,
`AZURE_CLIENT_ID`, and `AZURE_CLIENT_SECRET` from a service principal that has
read-only secret access. Store these values in the hosting platform's protected
configuration or CI secret store. Do not commit them or create a production
`.env` file. An Azure-hosted workload with managed identity does not need these
three variables.

## 3. Build, migrate, and start

```sh
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml run --rm migrate
docker compose -f docker-compose.production.yml up -d api
docker compose -f docker-compose.production.yml ps
curl http://127.0.0.1:3001/api/health
```

Copy the frontend build into `/var/www/au-merchhub/`. Build it with
`VITE_API_BASE_URL=https://YOUR_DOMAIN/merchhub-api` so its existing `/api/...`
requests reach the backend through the distinct URL prefix.

## 4. Nginx and HTTPS

Copy `deploy/nginx/au-merchhub.conf` into the existing HTTPS server block. Test
before reloading:

```sh
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d YOUR_DOMAIN
sudo certbot renew --dry-run
```

Verify all routes after deployment:

```text
https://YOUR_DOMAIN/content/                 existing WordPress
https://YOUR_DOMAIN/api/                     existing lab API
https://YOUR_DOMAIN/merchhub/                AU MerchHub frontend
https://YOUR_DOMAIN/merchhub-api/api/health  AU MerchHub API
```

## 5. Linux hardening checklist

- SSH key authentication works; password authentication and root SSH login are disabled.
- Firewall permits only SSH, HTTP, and HTTPS.
- MySQL and the Node port are not publicly exposed.
- Automatic security updates are enabled.
- Docker and OS packages are patched.
- Backups exist and a restore has been tested.
- Application logs contain no tokens, secrets, or connection strings.
