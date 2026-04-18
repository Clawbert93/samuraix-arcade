#!/usr/bin/env python3
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path('/home/robert/OpenClawProjects')
TOOLS_ROOT = ROOT / '.tools' / 'psp_cso' / 'root' / 'usr'
CISO_BIN = TOOLS_ROOT / 'bin' / 'ciso'
SEVENZIP_BIN = TOOLS_ROOT / 'lib' / '7zip' / '7z'
SEVENZIP_LIB = TOOLS_ROOT / 'lib' / '7zip'


def run(cmd: list[str], *, env: dict[str, str] | None = None) -> None:
    subprocess.run(cmd, check=True, env=env)


def fetch_to_dir(source: str, dest_dir: Path) -> Path:
    parsed = urllib.parse.urlparse(source)
    if parsed.scheme in {'http', 'https'}:
        name = Path(parsed.path).name or 'download.bin'
        target = dest_dir / name
        req = urllib.request.Request(source, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=1800) as resp, target.open('wb') as fh:
            shutil.copyfileobj(resp, fh)
        return target
    path = Path(source).expanduser()
    if not path.is_absolute():
        path = Path.cwd() / path
    if not path.exists():
        raise FileNotFoundError(path)
    target = dest_dir / path.name
    shutil.copy2(path, target)
    return target


ARCHIVE_EXTS = ('.zip', '.7z', '.rar')
PASSTHROUGH_EXTS = ('.cso', '.pbp')


def sevenzip_env() -> dict[str, str]:
    env = dict(**dict())
    env.update({'LD_LIBRARY_PATH': str(SEVENZIP_LIB)})
    return env


def list_archive_entries(archive: Path) -> list[str]:
    list_cmd = [str(SEVENZIP_BIN), 'l', '-slt', str(archive)]
    listed = subprocess.run(list_cmd, check=True, capture_output=True, text=True, env=sevenzip_env())
    entries: list[str] = []
    current_path: str | None = None
    current_is_dir = False
    archive_seen = False
    for raw in listed.stdout.splitlines():
        line = raw.strip()
        if line.startswith('Path = '):
            value = line.removeprefix('Path = ')
            if not archive_seen:
                archive_seen = True
                current_path = None
                current_is_dir = False
                continue
            current_path = value
            current_is_dir = False
        elif line.startswith('Folder = '):
            current_is_dir = line.removeprefix('Folder = ') == '+'
        elif line == '' and current_path:
            if not current_is_dir:
                entries.append(current_path)
            current_path = None
            current_is_dir = False
    if current_path and not current_is_dir:
        entries.append(current_path)
    return entries


def extract_member(archive: Path, member: str, out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    run([str(SEVENZIP_BIN), 'e', '-y', f'-o{out_dir}', str(archive), member], env=sevenzip_env())
    extracted = out_dir / Path(member).name
    if not extracted.exists():
        raise SystemExit(f'Expected extracted file missing: {extracted}')
    return extracted


def resolve_psp_payload(source_path: Path, temp_dir: Path, *, depth: int = 0) -> Path:
    if depth > 6:
        raise SystemExit(f'Archive nesting too deep while resolving PSP payload: {source_path.name}')
    lower = source_path.name.lower()
    if lower.endswith('.iso') or lower.endswith(PASSTHROUGH_EXTS):
        return source_path
    if not lower.endswith(ARCHIVE_EXTS):
        raise SystemExit(f'Unsupported source type for PSP conversion: {source_path.name}')

    entries = list_archive_entries(source_path)
    preferred: list[str] = []
    archive_candidates: list[str] = []
    for name in entries:
        lowered = name.lower()
        if lowered.endswith('.cso'):
            preferred.append(name)
        elif lowered.endswith('.iso'):
            preferred.append(name)
        elif lowered.endswith('.pbp'):
            preferred.append(name)
        elif lowered.endswith(ARCHIVE_EXTS):
            archive_candidates.append(name)

    if preferred:
        chosen = preferred[0]
        extracted = extract_member(source_path, chosen, temp_dir / f'extracted_{depth}')
        return resolve_psp_payload(extracted, temp_dir, depth=depth + 1)

    if archive_candidates:
        chosen = archive_candidates[0]
        extracted = extract_member(source_path, chosen, temp_dir / f'nested_{depth}')
        return resolve_psp_payload(extracted, temp_dir, depth=depth + 1)

    raise SystemExit(f'No ISO/CSO/PBP payload found inside archive: {source_path.name}')


def human(size: int) -> str:
    units = ['B', 'KB', 'MB', 'GB', 'TB']
    value = float(size)
    for unit in units:
        if value < 1024 or unit == units[-1]:
            return f'{value:.1f} {unit}'
        value /= 1024
    return f'{size} B'


def main() -> int:
    parser = argparse.ArgumentParser(description='Convert a PSP ISO or archive containing an ISO/CSO/PBP into a web-friendlier payload using workspace-local tools.')
    parser.add_argument('source', help='Local path or public URL to a PSP .iso, .cso, .pbp, .zip, .7z, or .rar asset')
    parser.add_argument('--output-dir', default='.', help='Directory to write the .cso into')
    parser.add_argument('--level', type=int, default=9, help='ciso compression level (1-9, default: 9)')
    parser.add_argument('--keep-temp', action='store_true', help='Keep temporary download/extract directory for inspection')
    args = parser.parse_args()

    if not CISO_BIN.exists():
        raise SystemExit(f'Missing ciso binary: {CISO_BIN}')
    if not SEVENZIP_BIN.exists():
        raise SystemExit(f'Missing 7z binary: {SEVENZIP_BIN}')
    if not 1 <= args.level <= 9:
        raise SystemExit('Compression level must be between 1 and 9.')

    output_dir = Path(args.output_dir).expanduser()
    if not output_dir.is_absolute():
        output_dir = Path.cwd() / output_dir
    output_dir.mkdir(parents=True, exist_ok=True)

    scratch_root = ROOT / '.tmp_game_inspect'
    scratch_root.mkdir(parents=True, exist_ok=True)
    temp_dir = Path(tempfile.mkdtemp(prefix='psp_cso_', dir=str(scratch_root)))

    try:
        fetched = fetch_to_dir(args.source, temp_dir)
        payload_path = resolve_psp_payload(fetched, temp_dir)
        lower = payload_path.name.lower()
        if lower.endswith('.iso'):
            out_name = payload_path.with_suffix('.cso').name
            output_path = output_dir / out_name
            try:
                run([str(CISO_BIN), str(args.level), str(payload_path), str(output_path)])
            except subprocess.CalledProcessError as exc:
                raise SystemExit(
                    f'CSO conversion failed for {payload_path.name}. The source may not be a valid PSP ISO, or ciso may have rejected it. Original error: {exc}'
                ) from exc
        else:
            output_path = output_dir / payload_path.name
            shutil.copy2(payload_path, output_path)

        input_size = payload_path.stat().st_size
        output_size = output_path.stat().st_size
        saved = input_size - output_size
        pct = (saved / input_size * 100.0) if input_size else 0.0
        print(f'input:  {payload_path} ({human(input_size)})')
        print(f'output: {output_path} ({human(output_size)})')
        print(f'saved:  {human(saved)} ({pct:.1f}%)')
        return 0
    finally:
        if args.keep_temp:
            print(f'temp kept at: {temp_dir}', file=sys.stderr)
        else:
            shutil.rmtree(temp_dir, ignore_errors=True)


if __name__ == '__main__':
    raise SystemExit(main())
