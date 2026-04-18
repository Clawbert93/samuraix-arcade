#!/usr/bin/env python3
from __future__ import annotations

import html
import json
import math
import re
from pathlib import Path
from typing import Dict, List

ROOT = Path('/home/robert/OpenClawProjects/samuraix-arcade')
LIBRARY_PATH = ROOT / 'data' / 'game-library.json'
OUTPUT_ROOT = ROOT / 'assets' / 'vee-covers'

SYSTEM_STYLES: Dict[str, Dict[str, str]] = {
    'gb': {'label': 'GB/GBC', 'a': '#5ff2a1', 'b': '#1d7f5b', 'c': '#091811'},
    'snes': {'label': 'SNES', 'a': '#d36bff', 'b': '#5a2fa8', 'c': '#160b29'},
    'nds': {'label': 'NINTENDO DS', 'a': '#ff6b6b', 'b': '#b32139', 'c': '#24080d'},
    'gba': {'label': 'GBA', 'a': '#4cb5ff', 'b': '#2b53cf', 'c': '#0a1331'},
    'n64': {'label': 'N64', 'a': '#ffd34d', 'b': '#b87311', 'c': '#251806'},
    'psx': {'label': 'PLAYSTATION', 'a': '#9ca6ff', 'b': '#4a56d4', 'c': '#10142e'},
    'psp': {'label': 'PSP', 'a': '#ff9b42', 'b': '#d64e1c', 'c': '#2a1109'},
}


def slugify(value: str) -> str:
    slug = re.sub(r'[^a-z0-9]+', '-', value.lower()).strip('-')
    return re.sub(r'-{2,}', '-', slug)


def wrap_title(text: str, width: int = 18) -> List[str]:
    words = text.split()
    lines: List[str] = []
    current = ''
    for word in words:
        candidate = f'{current} {word}'.strip()
        if len(candidate) <= width or not current:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines[:4]


def title_size(lines: List[str]) -> int:
    longest = max((len(line) for line in lines), default=10)
    if longest > 24:
        return 34
    if longest > 18:
        return 40
    return 46


def build_svg(title: str, system: str) -> str:
    style = SYSTEM_STYLES[system]
    lines = wrap_title(title)
    size = title_size(lines)
    start_y = 210 - ((len(lines) - 1) * (size + 10)) / 2
    title_tspans = []
    for idx, line in enumerate(lines):
        y = start_y + idx * (size + 10)
        title_tspans.append(f'<tspan x="64" y="{y:.0f}">{html.escape(line)}</tspan>')
    pattern_rows = []
    for idx in range(8):
        y = 54 + idx * 46
        width = 250 + (idx % 3) * 58
        opacity = 0.08 + (idx % 2) * 0.04
        pattern_rows.append(
            f'<rect x="{520 - width}" y="{y}" width="{width}" height="18" rx="9" fill="#ffffff" opacity="{opacity:.2f}" />'
        )
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="720" height="405" viewBox="0 0 720 405" fill="none">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="720" y2="405" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="{style['a']}" />
      <stop offset="0.52" stop-color="{style['b']}" />
      <stop offset="1" stop-color="{style['c']}" />
    </linearGradient>
    <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(110 78) rotate(38.5) scale(310 420)">
      <stop stop-color="#ffffff" stop-opacity="0.34"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="720" height="405" rx="30" fill="url(#bg)"/>
  <rect width="720" height="405" rx="30" fill="url(#glow)"/>
  <rect x="34" y="34" width="652" height="337" rx="24" fill="#0a0f1fcc" stroke="#ffffff2a"/>
  <g>
    {''.join(pattern_rows)}
  </g>
  <rect x="64" y="58" width="160" height="36" rx="18" fill="#ffffff1f" stroke="#ffffff38"/>
  <text x="144" y="81" text-anchor="middle" fill="#ffffff" font-size="18" font-family="Inter,Segoe UI,Arial,sans-serif" font-weight="700" letter-spacing="2">{html.escape(style['label'])}</text>
  <text x="64" y="128" fill="#ffffff" opacity="0.72" font-size="18" font-family="Inter,Segoe UI,Arial,sans-serif" font-weight="600" letter-spacing="3">SAMURAIX ARCADE</text>
  <text x="64" y="166" fill="#ffffff" font-size="{size}" font-family="Inter,Segoe UI,Arial,sans-serif" font-weight="800">
    {''.join(title_tspans)}
  </text>
  <text x="64" y="338" fill="#ffffff" opacity="0.86" font-size="18" font-family="Inter,Segoe UI,Arial,sans-serif" font-weight="600">Launch card powered by Vee</text>
  <text x="64" y="364" fill="#ffffff" opacity="0.62" font-size="14" font-family="Inter,Segoe UI,Arial,sans-serif">Discord jump card • browser saves stay local</text>
</svg>
'''


def main() -> int:
    library = json.loads(LIBRARY_PATH.read_text(encoding='utf-8'))
    count = 0
    for system, entries in library.items():
        if system not in SYSTEM_STYLES or not isinstance(entries, list):
            continue
        out_dir = OUTPUT_ROOT / system
        out_dir.mkdir(parents=True, exist_ok=True)
        for entry in entries:
            if not isinstance(entry, dict):
                continue
            title = str(entry.get('title') or '').strip()
            if not title:
                continue
            svg = build_svg(title, system)
            path = out_dir / f'{slugify(title)}.svg'
            path.write_text(svg, encoding='utf-8')
            count += 1
    print(json.dumps({'generated': count, 'outputRoot': str(OUTPUT_ROOT)}))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
