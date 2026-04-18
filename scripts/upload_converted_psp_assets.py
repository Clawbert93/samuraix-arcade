#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path

import boto3
from botocore.config import Config

ROOT = Path('/home/robert/OpenClawProjects')
ENV_PATH = ROOT / 'secrets' / 'arcade_r2.env'
RESULTS_PATH = ROOT / '.tmp_game_inspect' / 'psp_batch_results.json'
OUTPUT_DIR = ROOT / '.tmp_game_inspect' / 'psp_batch_out'
LIBRARY_PATH = ROOT / 'samuraix-arcade' / 'data' / 'game-library.json'


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    for raw in path.read_text(encoding='utf-8').splitlines():
        line = raw.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        k, v = line.split('=', 1)
        env[k.strip()] = v.strip()
    return env


def safe_name(name: str) -> str:
    return re.sub(r'[^A-Za-z0-9._-]+', '_', name).strip('_')


def parse_output_path(stdout: str) -> Path | None:
    for line in stdout.splitlines():
        if line.startswith('output: '):
            path_part = line[len('output: '):].split(' (', 1)[0].strip()
            return Path(path_part)
    return None


def client_from_env(env: dict[str, str]):
    endpoint = env['R2_S3_ENDPOINT']
    return boto3.client(
        's3',
        endpoint_url=endpoint,
        aws_access_key_id=env['R2_ACCESS_KEY_ID'],
        aws_secret_access_key=env['R2_SECRET_ACCESS_KEY'],
        region_name='auto',
        config=Config(signature_version='s3v4'),
    )


def upload_file(s3, bucket: str, key: str, local_path: Path) -> None:
    with local_path.open('rb') as fh:
        s3.upload_fileobj(fh, bucket, key, ExtraArgs={'ContentType': 'application/octet-stream'})


def main() -> int:
    env = load_env(ENV_PATH)
    bucket = env['R2_BUCKET_NAME']
    public_base = env['R2_PUBLIC_BASE_URL'].rstrip('/')
    s3 = client_from_env(env)

    results = json.loads(RESULTS_PATH.read_text(encoding='utf-8'))
    library = json.loads(LIBRARY_PATH.read_text(encoding='utf-8'))

    uploads: list[dict[str, str]] = []
    by_title: dict[str, str] = {}
    for row in results:
        if row.get('status') != 'ok':
            continue
        output_path = parse_output_path(str(row.get('stdout') or ''))
        if not output_path or not output_path.exists():
            continue
        key = f"psp/{safe_name(output_path.name)}"
        upload_file(s3, bucket, key, output_path)
        public_url = f"{public_base}/{key}"
        uploads.append({'title': str(row.get('title') or ''), 'key': key, 'url': public_url})
        by_title[str(row.get('title') or '')] = public_url

    for entry in library.get('psp', []):
        title = str(entry.get('title') or '')
        if title not in by_title:
            continue
        entry['url'] = by_title[title]
        notes = str(entry.get('notes') or '').strip()
        extra = ' Repacked to a smaller CSO payload for web delivery.'
        if extra.strip() not in notes:
            entry['notes'] = (notes + extra).strip()

    LIBRARY_PATH.write_text(json.dumps(library, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps({'uploads': uploads, 'updatedLibrary': str(LIBRARY_PATH)}, indent=2, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
