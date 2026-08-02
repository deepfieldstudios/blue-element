# 2026-BlueElement — website

Built by Deep Field. Live: https://blueelementstore.com

- **Host:** GitHub Pages (`main` branch, root) under the Deep Field org
- **Domain:** blueelementstore.com (Namecheap; apex A-records + `www` CNAME → Pages)

## Deploy
Push to `main` → Pages auto-deploys. `CNAME` pins the domain; `.nojekyll` keeps folders intact.

## Local preview
```
python3 -m http.server 8000   # http://localhost:8000
```

See ../../../_CLIENT_TEMPLATE/04_Build/DEPLOY.md for the full go-live checklist.
