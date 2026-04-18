#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

ROOT = Path('/home/robert/OpenClawProjects')
LIBRARY_PATH = ROOT / 'samuraix-arcade' / 'data' / 'game-library.json'
VALID_SYSTEMS = ['gb', 'snes', 'gba', 'nds', 'n64', 'psx', 'psp']


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding='utf-8'))


def save_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def main() -> int:
    parser = argparse.ArgumentParser(description='Set or add an external URL for a SamuraiX Arcade curated game entry.')
    parser.add_argument('--system', required=True, choices=VALID_SYSTEMS)
    parser.add_argument('--title', required=True)
    parser.add_argument('--url', required=True)
    parser.add_argument('--file', help='Optional fallback local file path to keep on the entry')
    parser.add_argument('--notes', help='Replace notes text for the entry')
    parser.add_argument('--create', action='store_true', help='Create the entry if it does not exist yet')
    args = parser.parse_args()

    library = load_json(LIBRARY_PATH)
    entries = library.setdefault(args.system, [])
    for entry in entries:
        if str(entry.get('title')) == args.title:
            entry['url'] = args.url
            if args.file:
                entry['file'] = args.file
            if args.notes:
                entry['notes'] = args.notes
            save_json(LIBRARY_PATH, library)
            print(f'Updated {args.system}:{args.title}')
            return 0

    if not args.create:
        raise SystemExit(f'Entry not found for {args.system}:{args.title}. Pass --create to add it.')

    new_entry = {'title': args.title, 'url': args.url, 'notes': args.notes or 'Externally hosted curated game.'}
    if args.file:
        new_entry['file'] = args.file
    entries.append(new_entry)
    save_json(LIBRARY_PATH, library)
    print(f'Created {args.system}:{args.title}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
