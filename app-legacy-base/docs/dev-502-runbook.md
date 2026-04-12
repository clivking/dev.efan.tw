# DEV 502 Runbook

Use this when `https://dev.efan.tw` returns `502 Bad Gateway`.

Date of last verified incident: `2026-04-11`.

## Purpose

This runbook separates three layers that are easy to confuse:

- `app`: `efan-app-dev`
- `tunnel`: `proxy_cloudflared`
- `edge`: Cloudflare response for `https://dev.efan.tw`

Do not assume a `502` means the Next.js app is down.

## Fast Diagnosis

Run these checks in order from the repo root:

```powershell
docker compose ps
docker exec efan-app-dev node -e "fetch('http://127.0.0.1:3000').then(async r=>{console.log('STATUS',r.status); console.log((await r.text()).slice(0,200));}).catch(err=>{console.error(err); process.exit(1)})"
curl.exe -I https://dev.efan.tw
```

Interpretation:

- container-local `200` plus public `502`: app is healthy, problem is in tunnel or Cloudflare path
- container-local failure: fix app/container first

## Proven Local Checks

These checks were useful in the `2026-04-11` incident:

```powershell
docker run --rm --network proxy_net curlimages/curl:8.12.1 -sS -D - http://efan-app-dev:3000/ -o /dev/null
docker run --rm --network proxy_net curlimages/curl:8.12.1 -sS -H "Host: dev.efan.tw" -D - http://efan-app-dev:3000/ -o /dev/null
docker logs --tail 200 proxy_cloudflared
docker run --rm --network proxy_net curlimages/curl:8.12.1 -sS http://proxy_cloudflared:20241/metrics
```

Interpretation:

- `proxy_net -> efan-app-dev:3000` returns `200`: Docker network path is fine
- `Host: dev.efan.tw` also returns `200`: host-based routing in app is fine
- `cloudflared_tunnel_ha_connections 4`: tunnel is connected to edge
- `cloudflared_tunnel_request_errors 0`: tunnel is not reporting origin proxy failures

## Recovery Step

If app checks are healthy but `https://dev.efan.tw` still returns Cloudflare `502`, restart the tunnel container:

```powershell
docker restart proxy_cloudflared
```

Then verify:

```powershell
curl.exe -I https://dev.efan.tw
curl.exe https://dev.efan.tw -o NUL -s -w "%{http_code} %{time_total}\n"
```

For stability, repeat the header check a few times:

```powershell
1..3 | ForEach-Object { curl.exe -I https://dev.efan.tw; Start-Sleep -Seconds 2 }
```

## What This Incident Was

On `2026-04-11`, the observed facts were:

- `efan-app-dev` returned `200` locally
- `proxy_net -> efan-app-dev:3000` returned `200`
- public `https://dev.efan.tw` returned Cloudflare `502`
- restarting `proxy_cloudflared` restored public `200`

Best current interpretation:

- this was a `Cloudflare Tunnel` runtime problem
- it was not a Next.js app failure
- it did not look like a local `caddy` issue on this machine

## Escalate Further If

Escalate beyond this machine if all of these are true:

- `efan-app-dev` is healthy
- `proxy_net -> efan-app-dev:3000` is healthy
- `proxy_cloudflared` shows active HA connections
- restarting `proxy_cloudflared` does not restore `dev.efan.tw`

At that point, investigate:

- Cloudflare Zero Trust tunnel status
- tunnel route binding for `dev.efan.tw`
- external Cloudflare edge incidents
