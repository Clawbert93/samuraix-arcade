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


def extract_iso(archive: Path, temp_dir: Path) -> Path:
    env = dict(**dict())
    env.update({'LD_LIBRARY_PATH': str(SEVENZIP_LIB)})
    list_cmd = [str(SEVENZIP_BIN), 'l', '-ba', str(archive)]
    listed = subprocess.run(list_cmd, check=True, capture_output=True, text=True, env=env)
    iso_candidates: list[str] = []
    for line in listed.stdout.splitlines():
        parts = line.split()
        if not parts:
            continue
        name = parts[-1]
        if name.lower().endswith('.iso'):
            iso_candidates.append(name)
    if not iso_candidates:
        raise SystemExit(f'No .iso found inside archive: {archive.name}')
    chosen = iso_candidates[0]
    out_dir = temp_dir / 'extracted'
    out_dir.mkdir(parents=True, exist_ok=True)
    run([str(SEVENZIP_BIN), 'e', '-y', f'-o{out_dir}', str(archive), chosen], env=env)
    extracted = out_dir / Path(chosen).name
    if not extracted.exists():
        raise SystemExit(f'Expected extracted ISO missing: {extracted}')
    return extracted


def ensure_iso(source_path: Path, temp_dir: Path) -> Path:
    lower = source_path.name.lower()
    if lower.endswith('.iso'):
        return source_path
    if lower.endswith('.cso'):
        raise SystemExit('Source is already a .cso file.')
    if lower.endswith(('.zip', '.7z', '.rar')):
        return extract_iso(source_path, temp_dir)
    raise SystemExit(f'Unsupported source type for CSO conversion: {source_path.name}')


def human(size: int) -> str:
    units = ['B', 'KB', 'MB', 'GB', 'TB']
    value = float(size)
    for unit in units:
        if value < 1024 or unit == units[-1]:
            return f'{value:.1f} {unit}'
        value /= 1024
    return f'{size} B'


def main() -> int:
    parser = argparse.ArgumentParser(description='Convert a PSP ISO or archive containing an ISO into a .cso using workspace-local tools.')
    parser.add_argument('source', help='Local path or public URL to a PSP .iso, .zip, .7z, or .rar asset')
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
        iso_path = ensure_iso(fetched, temp_dir)
        out_name = iso_path.with_suffix('.cso').name
        output_path = output_dir / out_name
        try:
            run([str(CISO_BIN), str(args.level), str(iso_path), str(output_path)])
        except subprocess.CalledProcessError as exc:
            raise SystemExit(
                f'CSO conversion failed for {iso_path.name}. The source may not be a valid PSP ISO, or ciso may have rejected it. Original error: {exc}'
            ) from exc

        input_size = iso_path.stat().st_size
        output_size = output_path.stat().st_size
        saved = input_size - output_size
        pct = (saved / input_size * 100.0) if input_size else 0.0
        print(f'input:  {iso_path} ({human(input_size)})')
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
