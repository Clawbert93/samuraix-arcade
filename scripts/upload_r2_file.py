#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

import boto3
from botocore.config import Config

ROOT = Path('/home/robert/OpenClawProjects')
ENV_PATH = ROOT / 'secrets' / 'arcade_r2.env'


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    for raw in path.read_text(encoding='utf-8').splitlines():
        line = raw.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        k, v = line.split('=', 1)
        env[k.strip()] = v.strip()
    return env


def main() -> int:
    parser = argparse.ArgumentParser(description='Upload a local file to SamuraiX Arcade R2 and print the public URL.')
    parser.add_argument('local_path')
    parser.add_argument('key')
    parser.add_argument('--content-type', default='application/octet-stream')
    args = parser.parse_args()

    local_path = Path(args.local_path).expanduser()
    if not local_path.is_absolute():
        local_path = Path.cwd() / local_path
    if not local_path.exists():
        raise SystemExit(f'Missing local file: {local_path}')

    env = load_env(ENV_PATH)
    bucket = env['R2_BUCKET_NAME']
    endpoint = env.get('R2_S3_ENDPOINT') or f"https://{env['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com"
    public_base = env['R2_PUBLIC_BASE_URL'].rstrip('/')

    client = boto3.client(
        's3',
        endpoint_url=endpoint,
        aws_access_key_id=env['R2_ACCESS_KEY_ID'],
        aws_secret_access_key=env['R2_SECRET_ACCESS_KEY'],
        region_name='auto',
        config=Config(signature_version='s3v4'),
    )

    with local_path.open('rb') as fh:
        client.upload_fileobj(
            fh,
            bucket,
            args.key,
            ExtraArgs={'ContentType': args.content_type},
        )

    print(f'{public_base}/{args.key}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
