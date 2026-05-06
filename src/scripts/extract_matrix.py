from pathlib import Path
import json
import re

try:
    import openpyxl
except ImportError as exc:
    raise SystemExit("openpyxl is required to extract the Axoft matrix data") from exc

ROOT = Path(__file__).resolve().parents[2]
WORKBOOK = ROOT / "public" / "assets" / "materials" / "axoft-role-task-solution-matrix.xlsx"
OUTPUT = ROOT / "src" / "data" / "matrix.generated.js"


def clean(value):
    if value is None:
        return ""
    return str(value).strip()


def split_solutions(value):
    text = clean(value)
    if not text:
        return []
    parts = re.split(r",\s*(?=[А-ЯA-ZЁ0-9])", text)
    return [part.strip() for part in parts if part.strip()]


wb = openpyxl.load_workbook(WORKBOOK, data_only=True)
ws = wb["Матрица Роль-Задача-Решение"]

rows = []
for row in ws.iter_rows(min_row=2, values_only=True):
    role, block, task1, task2, task3, solutions, result1, result2, result3 = row[:9]
    if not clean(role):
        continue
    rows.append(
        {
            "role": clean(role),
            "block": clean(block),
            "pains": [clean(task1), clean(task2), clean(task3)],
            "solutions": split_solutions(solutions),
            "results": [clean(result1), clean(result2), clean(result3)],
        }
    )

OUTPUT.write_text(
    "export const matrix = "
    + json.dumps(rows, ensure_ascii=False, indent=2)
    + ";\n",
    encoding="utf-8",
)

print(f"Generated {len(rows)} matrix rows at {OUTPUT}")
