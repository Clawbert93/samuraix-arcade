#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import urllib.request
from pathlib import Path
from typing import Any

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

ROOT = Path('/home/robert/OpenClawProjects')
ENV_PATH = ROOT / 'secrets' / 'arcade_r2.env'
MANIFEST_PATH = ROOT / 'samuraix-arcade' / 'data' / 'pending-large-assets.json'
DISCORD_WINDOW_PATH = ROOT / '.openclaw_state' / 'games_window_2026-04-17_2249_2309.json'
CACHE_DIR = ROOT / '.tmp_game_inspect'
VALID_GROUPS = {'pending', 'live'}


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.exists():
        return env
    for raw in path.read_text(encoding='utf-8').splitlines():
        line = raw.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        k, v = line.split('=', 1)
        env[k.strip()] = v.strip()
    return env


def safe_name(name: str) -> str:
    return re.sub(r'[^A-Za-z0-9._-]+', '_', name)


def get_endpoint(env: dict[str, str]) -> str:
    endpoint = env.get('R2_S3_ENDPOINT', '').strip()
    if endpoint:
        return endpoint
    account_id = env.get('R2_ACCOUNT_ID', '').strip()
    if account_id:
        return f'https://{account_id}.r2.cloudflarestorage.com'
    raise SystemExit('Missing R2_ACCOUNT_ID or R2_S3_ENDPOINT in secrets/arcade_r2.env')


def client_from_env(env: dict[str, str]):
    return boto3.client(
        's3',
        endpoint_url=get_endpoint(env),
        aws_access_key_id=env['R2_ACCESS_KEY_ID'],
        aws_secret_access_key=env['R2_SECRET_ACCESS_KEY'],
        region_name='auto',
        config=Config(signature_version='s3v4'),
    )


def ensure_local_copy(source_filename: str, url: str, expected_size: int) -> Path:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    local = CACHE_DIR / safe_name(source_filename)
    if local.exists() and local.stat().st_size == expected_size:
        return local
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=600) as resp, open(local, 'wb') as fh:
        shutil.copyfileobj(resp, fh)
    return local


def upload_file(s3: Any, bucket: str, key: str, local_path: Path, dry_run: bool = False) -> str:
    if dry_run:
        return f'dry-run upload {local_path.name} -> {key}'
    try:
        head = s3.head_object(Bucket=bucket, Key=key)
        remote_size = int(head.get('ContentLength') or -1)
        if remote_size == local_path.stat().st_size:
            return f'skip existing {key}'
    except ClientError:
        pass
    with local_path.open('rb') as fh:
        s3.upload_fileobj(fh, bucket, key, ExtraArgs={'ContentType': 'application/octet-stream'})
    return f'uploaded {key}'


def main() -> int:
    parser = argparse.ArgumentParser(description='Upload pending SamuraiX Arcade assets to Cloudflare R2.')
    parser.add_argument('--group', action='append', choices=sorted(VALID_GROUPS), help='Which asset group to upload: pending, live. Default: both')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    groups = set(args.group or VALID_GROUPS)
    env = load_env(ENV_PATH)
    bucket = env.get('R2_BUCKET_NAME', '').strip()
    if not bucket:
        raise SystemExit('Missing R2_BUCKET_NAME in secrets/arcade_r2.env')

    manifest = json.loads(MANIFEST_PATH.read_text(encoding='utf-8'))
    discord_rows = json.loads(DISCORD_WINDOW_PATH.read_text(encoding='utf-8'))
    by_filename = {}
    for row in discord_rows:
        by_filename.setdefault(row['filename'], row)

    if not args.dry_run:
        s3 = client_from_env(env)
        s3.head_bucket(Bucket=bucket)
    else:
        s3 = None

    actions: list[str] = []

    if 'pending' in groups:
        for item in manifest.get('pendingExternal', []):
            row = by_filename.get(item['sourceFilename'])
            if not row:
                actions.append(f"missing source {item['sourceFilename']}")
                continue
            local = ensure_local_copy(item['sourceFilename'], row['url'], int(item['sizeBytes']))
            actions.append(upload_file(s3, bucket, item['preferredStorageKey'], local, dry_run=args.dry_run))

    if 'live' in groups:
        for item in manifest.get('recommendMoveExternal', []):
            current_file = str(item['currentLibraryFile'])
            local = ROOT / 'samuraix-arcade' / current_file
            if not local.exists():
                actions.append(f'missing live file {current_file}')
                continue
            key = current_file.removeprefix('games/')
            actions.append(upload_file(s3, bucket, key, local, dry_run=args.dry_run))

    print(json.dumps({'bucket': bucket, 'endpoint': get_endpoint(env), 'actions': actions}, indent=2, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
