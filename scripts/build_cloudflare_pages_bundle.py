#!/usr/bin/env python3
from __future__ import annotations

import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'
MAX_ASSET_BYTES = 25 * 1024 * 1024
COPY_ROOT_FILES = ['index.html', 'play.html', 'activity.html', 'room-bridge.html', 'psp-debug.html', '.nojekyll', '_headers']
COPY_DATA_FILES = ['pending-large-assets.json', 'r2-cors.arcade-example.json', 'vee-arcade-meta.json']


def reset_dist() -> None:
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True, exist_ok=True)


def copy_root_files() -> None:
    for name in COPY_ROOT_FILES:
        src = ROOT / name
        if src.exists():
            dst = DIST / name
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)


def copy_assets() -> None:
    src = ROOT / 'assets'
    dst = DIST / 'assets'
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)


def copy_extra_data() -> None:
    data_dir = DIST / 'data'
    data_dir.mkdir(parents=True, exist_ok=True)
    for name in COPY_DATA_FILES:
        src = ROOT / 'data' / name
        if src.exists():
            shutil.copy2(src, data_dir / name)


def file_size_ok(path: Path) -> bool:
    return path.exists() and path.is_file() and path.stat().st_size < MAX_ASSET_BYTES


def bundle_library() -> dict:
    src_library = json.loads((ROOT / 'data' / 'game-library.json').read_text(encoding='utf-8'))
    dist_games = DIST / 'games'
    bundled = {}
    kept_local = 0
    skipped_local = []

    for system, entries in src_library.items():
        output_entries = []
        for entry in entries:
            if not isinstance(entry, dict):
                continue
            candidate = dict(entry)
            url = str(candidate.get('url') or '').strip()
            file_value = str(candidate.get('file') or '').strip()
            if url:
                output_entries.append(candidate)
                continue
            if not file_value:
                continue
            src_file = ROOT / file_value
            if not file_size_ok(src_file):
                skipped_local.append({'system': system, 'title': candidate.get('title'), 'file': file_value})
                continue
            dst_file = DIST / file_value
            dst_file.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src_file, dst_file)
            kept_local += 1
            output_entries.append(candidate)
        bundled[system] = output_entries

    (DIST / 'data' / 'game-library.json').write_text(
        json.dumps(bundled, indent=2, ensure_ascii=False) + '\n', encoding='utf-8'
    )
    (DIST / 'data' / 'cloudflare-build-report.json').write_text(
        json.dumps(
            {
                'maxAssetBytes': MAX_ASSET_BYTES,
                'keptLocalEntries': kept_local,
                'skippedLocalEntries': skipped_local,
            },
            indent=2,
            ensure_ascii=False,
        )
        + '\n',
        encoding='utf-8',
    )
    return {'keptLocalEntries': kept_local, 'skippedLocalEntries': skipped_local}


def main() -> int:
    reset_dist()
    copy_root_files()
    copy_assets()
    copy_extra_data()
    summary = bundle_library()
    print(
        json.dumps(
            {
                'dist': str(DIST),
                'maxAssetBytes': MAX_ASSET_BYTES,
                'keptLocalEntries': summary['keptLocalEntries'],
                'skippedLocalEntries': len(summary['skippedLocalEntries']),
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
