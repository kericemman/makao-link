# RendaHomes Hostinger VPS Deployment

This repo deploys from GitHub Actions to a Hostinger VPS whenever changes are pushed to `main` or `master`.

## Required GitHub Secrets

Add these in GitHub:

- `HOSTINGER_HOST` - VPS IP address or hostname
- `HOSTINGER_USER` - SSH user
- `HOSTINGER_SSH_KEY` - private SSH key allowed to access the VPS
- `HOSTINGER_SSH_PORT` - usually `22`
- `HOSTINGER_APP_DIR` - deploy directory, for example `/var/www/rendahomes`
- `VITE_API_URL` - `https://updates.rendahomes.com/api`
- `VITE_LANDLORD_URL` - `https://landlord.rendahomes.com`
- `VITE_USER_URL` - `https://user.rendahomes.com`

## VPS Requirements

Install these on the VPS before the first deployment:

```bash
sudo apt update
sudo apt install -y nginx rsync
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

Create the deployment directory:

```bash
sudo mkdir -p /var/www/rendahomes
sudo chown -R "$USER":"$USER" /var/www/rendahomes
```

## Backend Environment

Create this file on the VPS:

```bash
nano /var/www/rendahomes/backend/.env
```

Use the production values from `backend/.env.example`.

Important values:

- `NODE_ENV=production`
- `HOST=127.0.0.1`
- `PORT=5000`
- `CLIENT_URL=https://rendahomes.com`
- `CLIENT_URLS=https://rendahomes.com,https://landlord.rendahomes.com,https://user.rendahomes.com,https://app.rendahomes.com`
- `LANDLORD_URL=https://landlord.rendahomes.com`
- `USER_URL=https://user.rendahomes.com`
- MongoDB, Cloudinary, Resend, Paystack, and JWT secrets

## Nginx

Use `deploy/hostinger-nginx.conf` as the starting point.

After copying it to `/etc/nginx/sites-available/rendahomes`:

```bash
sudo ln -s /etc/nginx/sites-available/rendahomes /etc/nginx/sites-enabled/rendahomes
sudo nginx -t
sudo systemctl reload nginx
```

## First Deploy

After GitHub Secrets and VPS env are ready:

```bash
git add .
git commit -m "Prepare RendaHomes production deployment"
git push origin main
```

GitHub Actions will build all apps, rsync files to the VPS, install backend production dependencies, and restart the API with PM2.
