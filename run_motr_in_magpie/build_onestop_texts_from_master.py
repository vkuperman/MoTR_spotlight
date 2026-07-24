import argparse
import csv
import re
import shutil
import sys
from collections import OrderedDict
from datetime import datetime
from pathlib import Path

from inspect_onestop_master import read_shared_strings, read_sheet_rows, workbook_sheets


MASTER_SHEET = "Sheet1"
EXPECTED_PARAGRAPHS = 143
LEVEL_COLUMNS = {
    "Elementary": "Ele:",
    "Intermediate": "Int:",
    "Advanced": "Adv:",
}


def collapse_ws(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def source_stem(filename):
    normalized = str(filename or "").replace("\\", "/")
    return Path(normalized).stem


def records_from_sheet(xlsx_path, sheet_name):
    import zipfile

    with zipfile.ZipFile(xlsx_path) as zf:
        shared_strings = read_shared_strings(zf)
        sheets = dict(workbook_sheets(zf))
        if sheet_name not in sheets:
            raise ValueError(f"Sheet {sheet_name!r} not found. Available: {', '.join(sheets)}")
        rows = read_sheet_rows(zf, sheets[sheet_name], shared_strings)

    if not rows:
        return []

    header_values = rows[0][1]
    max_col = max(header_values.keys(), default=0)
    headers = [collapse_ws(header_values.get(i, "")) for i in range(1, max_col + 1)]
    records = []
    for _, values in rows[1:]:
        record = {
            headers[i - 1]: collapse_ws(values.get(i, ""))
            for i in range(1, max_col + 1)
            if i - 1 < len(headers) and headers[i - 1]
        }
        if record.get("FileName") and record.get("Paragraph"):
            records.append(record)
    return records


def group_records(records):
    groups = OrderedDict()
    for record in sorted(
        records,
        key=lambda r: (
            int(float(r.get("Article Number") or 0)),
            int(float(r.get("Paragraph") or 0)),
        ),
    ):
        stem = source_stem(record["FileName"])
        groups.setdefault(stem, []).append(record)
    return groups


def validate_records(records):
    level_counts = {
        level: sum(1 for record in records if collapse_ws(record.get(source_col)))
        for level, source_col in LEVEL_COLUMNS.items()
    }
    article_count = len({record.get("Article Number") for record in records})
    paragraph_count = len(records)
    return article_count, paragraph_count, level_counts


def write_text_csvs(groups, texts_dir):
    texts_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    existing_csvs = sorted(texts_dir.glob("*.csv"))
    backup_dir = None
    if existing_csvs:
        backup_dir = texts_dir.parent / f"Texts_legacy_backup_{timestamp}"
        backup_dir.mkdir()
        for csv_path in existing_csvs:
            shutil.move(str(csv_path), str(backup_dir / csv_path.name))

    fieldnames = [
        "Article Number",
        "Title",
        "Paragraph",
        "Source File",
        "Elementary",
        "Intermediate",
        "Advanced",
        "Q:",
        "Qa:",
        "Qb:",
        "Qc:",
        "Qd:",
        "Q1:",
        "Q1a:",
        "Q1b:",
        "Q1c:",
        "Q1d:",
        "Q2:",
        "Q2a:",
        "Q2b:",
        "Q2c:",
        "Q2d:",
    ]
    for stem, article_records in groups.items():
        out_path = texts_dir / f"{stem}.csv"
        with out_path.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for record in article_records:
                writer.writerow(
                    {
                        "Article Number": record.get("Article Number", ""),
                        "Title": record.get("Title", ""),
                        "Paragraph": record.get("Paragraph", ""),
                        "Source File": record.get("FileName", ""),
                        "Elementary": record.get("Ele:", ""),
                        "Intermediate": record.get("Int:", ""),
                        "Advanced": record.get("Adv:", ""),
                        "Q:": record.get("Q:", ""),
                        "Qa:": record.get("Qa:", ""),
                        "Qb:": record.get("Qb:", ""),
                        "Qc:": record.get("Qc:", ""),
                        "Qd:": record.get("Qd:", ""),
                        "Q1:": record.get("Q1:", ""),
                        "Q1a:": record.get("Q1a:", ""),
                        "Q1b:": record.get("Q1b:", ""),
                        "Q1c:": record.get("Q1c:", ""),
                        "Q1d:": record.get("Q1d:", ""),
                        "Q2:": record.get("Q2:", ""),
                        "Q2a:": record.get("Q2a:", ""),
                        "Q2b:": record.get("Q2b:", ""),
                        "Q2c:": record.get("Q2c:", ""),
                        "Q2d:": record.get("Q2d:", ""),
                    }
                )
    return backup_dir


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--master",
        default=str(Path(__file__).resolve().parent / "OneStop" / "OneStopMasterList_v2.xlsx"),
        help="Path to OneStop master list workbook (OneStopMasterList_v2.xlsx)",
    )
    parser.add_argument(
        "--root",
        default=Path(__file__).resolve().parent,
        type=Path,
        help="run_motr_in_magpie root directory",
    )
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--allow-count-mismatch",
        action="store_true",
        help="Write files even if the workbook does not contain the expected paragraph row count.",
    )
    args = parser.parse_args()

    master_path = Path(args.master)
    if not master_path.exists():
        print(f"Master workbook not found: {master_path}", file=sys.stderr)
        return 1

    records = records_from_sheet(master_path, MASTER_SHEET)
    groups = group_records(records)
    article_count, paragraph_count, level_counts = validate_records(records)

    print(f"articles: {article_count}")
    print(f"paragraph rows: {paragraph_count}")
    for level, count in level_counts.items():
        print(f"{level}: {count}")
    print(f"total paragraph-level trials: {sum(level_counts.values())}")

    count_mismatch = paragraph_count != EXPECTED_PARAGRAPHS or any(
        count != EXPECTED_PARAGRAPHS for count in level_counts.values()
    )
    if count_mismatch:
        print(
            f"Expected {EXPECTED_PARAGRAPHS} paragraph rows per level, "
            f"but got rows={paragraph_count}, levels={level_counts}",
            file=sys.stderr,
        )
        if not args.allow_count_mismatch:
            return 2

    if args.dry_run:
        return 0

    one_stop_dir = args.root / "OneStop"
    texts_dir = one_stop_dir / "Texts"
    backup_dir = write_text_csvs(groups, texts_dir)
    shutil.copy2(master_path, one_stop_dir / "OneStop Stimuli .xlsx")

    print(f"wrote CSV files: {len(groups)}")
    if backup_dir:
        print(f"legacy CSV backup: {backup_dir}")
    print(f"copied workbook: {one_stop_dir / 'OneStop Stimuli .xlsx'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
