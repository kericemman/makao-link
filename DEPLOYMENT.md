# RendaHomes Clean Hostinger VPS Deployment

This is the clean deployment path for RendaHomes.

Production uses one shared backend API and four static frontend apps:

- `https://rendahomes.com` -> `frontend-main`
- `https://landlord.rendahomes.com` -> `frontend-landlord`
- `https://user.rendahomes.com` -> `frontend-user`
- `https://app.rendahomes.com` -> `frontend-app`
- `https://updates.rendahomes.com` -> `backend` on PM2

Use `/var/www/rendahomes` as the clean production folder. Do not deploy from `/root/makao-link`; Nginx usually cannot serve static sites cleanly from `/root`.

## 1. Prepare The VPS

SSH into the VPS from your Mac:

```bash
ssh -i ~/.ssh/rendahomes_github_action root@46.202.135.17
```

Install runtime tools:

```bash
apt update
apt install -y nginx rsync git curl
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
npm install -g pm2
```

Create the clean deployment folder:

```bash
mkdir -p /var/www/rendahomes/backend
mkdir -p /var/www/rendahomes/frontend-main
mkdir -p /var/www/rendahomes/frontend-landlord
mkdir -p /var/www/rendahomes/frontend-user
mkdir -p /var/www/rendahomes/frontend-app
```

## 2. Add The GitHub Deploy Key To The VPS

Still on the VPS:

```bash
mkdir -p /root/.ssh
chmod 700 /root/.ssh
nano /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys
```

Paste the public key from your Mac. On your Mac, you can print it with:

```bash
ssh-keygen -y -f ~/.ssh/rendahomes_github_action
```

Test from your Mac:

```bash
ssh -i ~/.ssh/rendahomes_github_action root@46.202.135.17
```

Do not continue until this login works.

## 3. Create Backend Production Env

On the VPS:

```bash
nano /var/www/rendahomes/backend/.env
```

Use real production values:

```bash
NODE_ENV=production
HOST=127.0.0.1
PORT=5000

CLIENT_URL=https://rendahomes.com
CLIENT_URLS=https://rendahomes.com,https://www.rendahomes.com,https://landlord.rendahomes.com,https://user.rendahomes.com,https://app.rendahomes.com
LANDLORD_URL=https://landlord.rendahomes.com
USER_URL=https://user.rendahomes.com

MONGO_URI=your_production_mongo_uri
JWT_SECRET=your_strong_jwt_secret
JWT_EXPIRE=7d

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=RendaHomes <noreply@rendahomes.com>

PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

## 4. Configure Nginx

Copy the repo file `deploy/hostinger-nginx.conf` to the VPS as:

```bash
nano /etc/nginx/sites-available/rendahomes
```

Enable it:

```bash
ln -sf /etc/nginx/sites-available/rendahomes /etc/nginx/sites-enabled/rendahomes
nginx -t
systemctl reload nginx
```

After DNS points to the VPS, add SSL:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d rendahomes.com -d www.rendahomes.com -d landlord.rendahomes.com -d user.rendahomes.com -d app.rendahomes.com -d updates.rendahomes.com
```

## 5. Create GitHub Secrets

In GitHub:

`Repository -> Settings -> Secrets and variables -> Actions -> New repository secret`

Create exactly these secrets:

```text
HOSTINGER_HOST=46.202.135.17
HOSTINGER_USER=root
HOSTINGER_SSH_PORT=22
HOSTINGER_APP_DIR=/var/www/rendahomes
VITE_API_URL=https://updates.rendahomes.com/api
VITE_LANDLORD_URL=https://landlord.rendahomes.com
VITE_USER_URL=https://user.rendahomes.com
```

Create the SSH key secret from your Mac:

```bash
base64 -i ~/.ssh/rendahomes_github_action | pbcopy
```

Paste the copied value into:

```text
HOSTINGER_SSH_KEY_B64
```

Use the private key file, not the `.pub` file.

## 6. Deploy

From your Mac:

```bash
cd /Users/user/Desktop/makao-link
git add .
git commit -m "Prepare clean Hostinger deployment"
git push origin main
```

GitHub Actions will build and deploy automatically.

You can also run it manually:

`GitHub -> Actions -> Deploy RendaHomes to Hostinger VPS -> Run workflow`

## 7. Verify Production

On the VPS:

```bash
pm2 status
pm2 logs rendahomes-api --lines 100
```

From your Mac:

```bash
curl https://updates.rendahomes.com/api/listings
curl https://rendahomes.com/robots.txt
curl https://rendahomes.com/sitemap.xml
```

Expected result:

- PM2 shows `rendahomes-api` online.
- `/api/listings` returns JSON.
- `robots.txt` and `sitemap.xml` load from the main domain.
