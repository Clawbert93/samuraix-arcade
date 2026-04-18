#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

ROOT = Path('/home/robert/OpenClawProjects')
LIBRARY_PATH = ROOT / 'samuraix-arcade' / 'data' / 'game-library.json'
MANIFEST_PATH = ROOT / 'samuraix-arcade' / 'data' / 'pending-large-assets.json'
VALID_SYSTEMS = ['gb', 'snes', 'gba', 'nds', 'n64', 'psx', 'psp']


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding='utf-8'))


def save_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def join_url(base: str, key: str) -> str:
    return base.rstrip('/') + '/' + key.lstrip('/')


def main() -> int:
    parser = argparse.ArgumentParser(description='Apply pending external arcade asset URLs from the manifest.')
    parser.add_argument('--base-url', required=True, help='Public HTTPS base URL, e.g. https://assets.example.com')
    parser.add_argument('--include-live-moves', action='store_true', help='Also move currently live >50 MB entries to external URLs')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    library = load_json(LIBRARY_PATH)
    manifest = load_json(MANIFEST_PATH)
    changes: list[str] = []

    for item in manifest.get('pendingExternal', []):
        system = str(item['system'])
        if system not in VALID_SYSTEMS:
            raise SystemExit(f'Invalid system in manifest: {system}')
        entries = library.setdefault(system, [])
        url = join_url(args.base_url, str(item['preferredStorageKey']))
        title = str(item['title'])
        notes = f"Large externally hosted asset. Source upload: {item['sourceFilename']}. {item['preferredPackaging']}"
        existing = next((entry for entry in entries if str(entry.get('title')) == title), None)
        if existing:
            existing['url'] = url
            existing['notes'] = notes
            changes.append(f'updated existing {system}:{title} -> {url}')
        else:
            entries.append({'title': title, 'url': url, 'notes': notes})
            changes.append(f'created {system}:{title} -> {url}')

    if args.include_live_moves:
        for item in manifest.get('recommendMoveExternal', []):
            system = str(item['system'])
            title = str(item['title'])
            current_file = str(item['currentLibraryFile'])
            storage_key = current_file.removeprefix('games/')
            url = join_url(args.base_url, storage_key)
            entries = library.setdefault(system, [])
            existing = next((entry for entry in entries if str(entry.get('title')) == title), None)
            if not existing:
                changes.append(f'skipped missing live entry {system}:{title}')
                continue
            existing['url'] = url
            changes.append(f'moved live {system}:{title} -> {url}')

    if args.dry_run:
        print(json.dumps({'changes': changes}, indent=2, ensure_ascii=False))
        return 0

    save_json(LIBRARY_PATH, library)
    print(json.dumps({'changes': changes}, indent=2, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
