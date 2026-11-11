# Assisted Listing Upload Limit

The admin-assisted listing form compresses each selected image in the browser and sends the images together as one multipart request. The API accepts up to 30 images, with a 10 MB per-file limit. The Nginx limit for the exact `POST /api/admin/assisted-listing-drafts` path is set to 40 MB to allow for a full set of compressed images and multipart overhead without raising limits for other API routes.

## Apply on the VPS

The repository's `deploy/hostinger-nginx.conf` is the reference config, but production TLS may be managed in a separate Nginx server block. Add the same exact-match location inside the active `updates.rendahomes.com` HTTPS server block:

```nginx
location = /api/admin/assisted-listing-drafts {
    client_max_body_size 40m;
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Keep the existing general API proxy location and other virtual hosts unchanged. Validate with `sudo nginx -t`, then reload with `sudo systemctl reload nginx`. If validation fails, do not reload; restore the previous config and re-run the syntax check.

Test first with a small image set, then increase the count. Nginx must be updated in the active TLS server block; changing only the HTTP reference block will not affect HTTPS uploads.
