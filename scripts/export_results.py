"""Export the reviewed paper-aligned website snapshot; never rescore results.

scripts/results-paper.json is aligned to the user-provided main.pdf, Table 2,
page 7 (2026-10-28). The local research TeX still contains an older table and
must not silently replace this snapshot. For a new paper, review and update
this JSON first, then rerun this exporter.
"""
import csv
import io
import json
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]
SOURCE = Path(__file__).with_name('results-paper.json')
COLUMNS = ['AIR', 'HSR', 'EOR', 'HAC', 'MEI', 'acc', 'pair', 'D', 'C', 'R', 'S']


def export():
    data = json.loads(SOURCE.read_text())
    rows = data['results']
    if not rows or {r['group'] for r in rows} != set(data['groups']):
        raise ValueError('Check the reviewed result groups before exporting.')
    keys = [(r['group'], r['model']) for r in rows]
    if len(set(keys)) != len(keys):
        raise ValueError('Duplicate model within a setting.')
    for row in rows:
        for key in COLUMNS:
            value = row[key]
            if value is None and key == 'C':
                continue
            if not isinstance(value, (int, float)):
                raise ValueError(f'Invalid {key} value for {row["model"]}')
    (PROJECT / 'dist/results.js').write_text('window.TWINPAST_RESULTS = ' + json.dumps(data, ensure_ascii=False, indent=2) + ';\n')
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=['group', 'model'] + COLUMNS)
    writer.writeheader()
    for row in rows:
        writer.writerow({**row, 'group': data['groups'][row['group']]})
    (PROJECT / 'dist/assets/results.csv').write_text(buffer.getvalue())
    print(f'Exported {len(rows)} rows from {data["source"]}.')


if __name__ == '__main__':
    export()
