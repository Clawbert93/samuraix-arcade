#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path('/home/robert/OpenClawProjects')
LIBRARY_PATH = ROOT / 'samuraix-arcade' / 'data' / 'game-library.json'
CONVERTER = ROOT / 'samuraix-arcade' / 'scripts' / 'convert_psp_asset_to_cso.py'
CACHE_ROOTS = [
    ROOT / '.tmp_game_inspect',
    ROOT / '.tmp_game_inspect' / 'discord_uploads',
]
OUTPUT_DIR = ROOT / '.tmp_game_inspect' / 'psp_batch_out'
RESULTS_PATH = ROOT / '.tmp_game_inspect' / 'psp_batch_results.json'


def find_local_source(url: str) -> str | None:
    name = Path(url.split('?', 1)[0]).name
    for base in CACHE_ROOTS:
        if not base.exists():
            continue
        for candidate in base.rglob(name):
            if candidate.is_file():
                return str(candidate)
    return None


def main() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    library = json.loads(LIBRARY_PATH.read_text(encoding='utf-8'))
    results: list[dict[str, object]] = []
    for entry in library.get('psp', []):
        title = str(entry.get('title') or '')
        source = str(entry.get('url') or entry.get('file') or '').strip()
        if not source:
            results.append({'title': title, 'status': 'skip', 'reason': 'missing source'})
            continue
        chosen_source = find_local_source(source) or source
        cmd = ['python3', str(CONVERTER), chosen_source, '--output-dir', str(OUTPUT_DIR)]
        proc = subprocess.run(cmd, capture_output=True, text=True)
        results.append({
            'title': title,
            'source': source,
            'chosenSource': chosen_source,
            'status': 'ok' if proc.returncode == 0 else 'error',
            'returncode': proc.returncode,
            'stdout': proc.stdout,
            'stderr': proc.stderr,
        })
        RESULTS_PATH.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding='utf-8')
    print(json.dumps({'resultsPath': str(RESULTS_PATH), 'outputDir': str(OUTPUT_DIR), 'count': len(results)}, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
