import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path


NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}


def col_index(cell_ref):
    letters = re.sub(r"[^A-Za-z]", "", cell_ref)
    n = 0
    for ch in letters.upper():
        n = n * 26 + ord(ch) - 64
    return n


def read_shared_strings(zf):
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    strings = []
    for si in root.findall("main:si", NS):
        strings.append("".join(t.text or "" for t in si.findall(".//main:t", NS)))
    return strings


def read_sheet_rows(zf, target, shared_strings):
    root = ET.fromstring(zf.read(target))
    rows = []
    for row in root.findall("main:sheetData/main:row", NS):
        values = {}
        for cell in row.findall("main:c", NS):
            idx = col_index(cell.attrib.get("r", "A1"))
            typ = cell.attrib.get("t")
            if typ == "s":
                v = cell.find("main:v", NS)
                values[idx] = shared_strings[int(v.text)] if v is not None and v.text else ""
            elif typ == "inlineStr":
                values[idx] = "".join(t.text or "" for t in cell.findall(".//main:t", NS))
            else:
                v = cell.find("main:v", NS)
                values[idx] = v.text if v is not None and v.text is not None else ""
        rows.append((int(row.attrib.get("r", len(rows) + 1)), values))
    return rows


def workbook_sheets(zf):
    wb = ET.fromstring(zf.read("xl/workbook.xml"))
    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    rid_to_target = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels}
    sheets = []
    for sheet in wb.findall("main:sheets/main:sheet", NS):
        rid = sheet.attrib[f"{{{NS['rel']}}}id"]
        target = rid_to_target[rid]
        if not target.startswith("xl/"):
            target = f"xl/{target}"
        sheets.append((sheet.attrib["name"], target))
    return sheets


def main():
    path = Path(sys.argv[1])
    print(f"path: {path}")
    print(f"exists: {path.exists()}")
    if not path.exists():
        return 1
    print(f"size: {path.stat().st_size}")
    with zipfile.ZipFile(path) as zf:
        shared_strings = read_shared_strings(zf)
        for sheet_name, target in workbook_sheets(zf):
            rows = read_sheet_rows(zf, target, shared_strings)
            print(f"\nSHEET: {sheet_name}")
            print(f"rows: {len(rows)}")
            for row_number, values in rows[:12]:
                max_col = min(max(values.keys(), default=0), 20)
                out = [values.get(i, "") for i in range(1, max_col + 1)]
                print(f"{row_number}: {out}")


if __name__ == "__main__":
    raise SystemExit(main())
