# SamuraiX Arcade R2 setup

This is the preferred path for oversized DS, PS1, and PSP game assets.

## Goal

- Keep the static site on GitHub Pages
- Put large game archives on Cloudflare R2
- Point `data/game-library.json` entries at public HTTPS URLs

## What is already done

- `assets/app.js` supports curated entries with `url`
- `data/pending-large-assets.json` tracks the big files waiting for external hosting
- `scripts/arcade_set_external_url.py` updates one entry at a time
- `scripts/arcade_apply_pending_external.py` can bulk-apply URLs from the pending manifest
- `scripts/upload_r2_pending_assets.py` uploads the staged pending/live large assets to R2 using `secrets/arcade_r2.env`
- `data/r2-cors.arcade-example.json` contains a starter CORS policy

## Recommended bucket shape

Bucket name example:

- `samuraix-arcade-assets`

Recommended object keys:

- `nds/...`
- `psx/...`
- `psp/...`

## Recommended public URL shape

Best production path:

- attach a custom domain in Cloudflare, for example `arcade-assets.samuraix.ai`

Acceptable temporary path:

- `https://<bucket>.<account-id>.r2.dev/...`

## Cloudflare dashboard steps

1. Create an R2 bucket
2. Enable public access for the bucket
3. Prefer adding a custom domain for the bucket
4. Add a CORS policy using `data/r2-cors.arcade-example.json`
5. Purge cache after CORS or object-path changes if needed

## Once the bucket is ready

### Dry-run the planned URL rewrites

```bash
python3 scripts/arcade_apply_pending_external.py \
  --base-url https://arcade-assets.example.com \
  --include-live-moves \
  --dry-run
```

### Apply the URL rewrites

```bash
python3 scripts/arcade_apply_pending_external.py \
  --base-url https://arcade-assets.example.com \
  --include-live-moves
```

This will:

- create library entries for the currently skipped large files
- move currently live >50 MB DS entries to external URLs too

## Upload helper

Once `secrets/arcade_r2.env` contains the bucket name, public base URL, access key ID, secret access key, and account endpoint, you can upload the staged assets with:

```bash
/home/robert/OpenClawProjects/.venv_arcade_r2/bin/python scripts/upload_r2_pending_assets.py --group pending --group live
```

## Suggested first-wave uploads

Start with these:

- `psp/Grand_Theft_Auto_Liberty_City_Stories.7z`
- `psp/Assassins_Creed_Bloodlines.zip`
- `psx/Tony_Hawks_Pro_Skater_2.zip`
- `psx/Crash_Bandicoot.zip`
- `psx/Resident_Evil_2_Dual_Shock_Ver.zip`
- `psx/Resident_Evil_3_Nemesis.zip`
- `nds/Kingdom_Hearts_Re-coded.zip`
- `nds/Pokemon_Black_Version_2.7z`

## Nice-to-have later

- convert large PS1 games to `.chd`
- convert large PSP `.iso` files to `.cso` where safe
- remove the now-external copies from the git repo after verifying the new URLs are stable
