#!/usr/bin/env python3
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from collections import defaultdict
from datetime import datetime, timedelta

NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
RELNS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NSMAP = {"a": NS}

FILL_TO_STATUS = {
    "3": "green",
    "4": "red",
    "5": "yellow",
    "2": "gray",
}

def col_to_num(col):
    n = 0
    for ch in col:
        n = n * 26 + ord(ch) - 64
    return n

def parse_ref(ref):
    m = re.match(r"([A-Z]+)(\d+)", ref)
    return int(m.group(2)), col_to_num(m.group(1))

def excel_serial_to_date(value):
    return datetime(1899, 12, 30) + timedelta(days=float(value))

def format_number(raw):
    if re.fullmatch(r"-?\d+\.0+", raw):
        return str(int(float(raw)))
    return raw

def format_date(raw):
    d = excel_serial_to_date(raw)
    return f"{d.month}월 {d.day}일"

def get_cell_text(cell, shared_strings, styles, numfmts):
    cell_type = cell.attrib.get("t")
    value_el = cell.find("a:v", NSMAP)
    if value_el is not None:
        raw = value_el.text or ""
        if cell_type == "s":
            return shared_strings[int(raw)]
        if cell_type == "b":
            return "TRUE" if raw == "1" else "FALSE"

        style_id = int(cell.attrib.get("s", "0") or 0)
        xf = styles[style_id] if style_id < len(styles) else {}
        fmt = numfmts.get(xf.get("numFmtId"), "")
        if raw and fmt and any(mark in fmt for mark in ("m", "d", "월", "일")) and re.fullmatch(r"\d+(\.\d+)?", raw):
            return format_date(raw)
        return format_number(raw)

    inline = cell.find("a:is", NSMAP)
    if inline is not None:
        return "".join(t.text or "" for t in inline.findall(".//a:t", NSMAP))
    return ""

def read_xlsx(path):
    with zipfile.ZipFile(path) as z:
        shared_strings = []
        if "xl/sharedStrings.xml" in z.namelist():
            root = ET.fromstring(z.read("xl/sharedStrings.xml"))
            for si in root.findall("a:si", NSMAP):
                shared_strings.append("".join(t.text or "" for t in si.findall(".//a:t", NSMAP)))

        styles_root = ET.fromstring(z.read("xl/styles.xml"))
        numfmts = {}
        numfmts_el = styles_root.find("a:numFmts", NSMAP)
        if numfmts_el is not None:
            for nf in numfmts_el:
                numfmts[nf.attrib["numFmtId"]] = nf.attrib["formatCode"]

        styles = [dict(xf.attrib) for xf in styles_root.find("a:cellXfs", NSMAP)]

        workbook = ET.fromstring(z.read("xl/workbook.xml"))
        rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
        relmap = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels}

        sheets = []
        for sheet in workbook.find("a:sheets", NSMAP):
            rid = sheet.attrib[f"{{{RELNS}}}id"]
            target = relmap[rid].lstrip("/")
            if not target.startswith("xl/"):
                target = "xl/" + target
            sheets.append((sheet.attrib["name"], target))

        result = {}
        for sheet_name, target in sheets:
            root = ET.fromstring(z.read(target))
            cells = {}
            styles_by_cell = {}
            for cell in root.findall(".//a:c", NSMAP):
                row, col = parse_ref(cell.attrib["r"])
                cells[(row, col)] = get_cell_text(cell, shared_strings, styles, numfmts)
                styles_by_cell[(row, col)] = int(cell.attrib.get("s", "0") or 0)

            result[sheet_name] = {
                "cells": cells,
                "styles": styles_by_cell,
                "styles_table": styles,
            }
        return result

def status_for_cell(sheet, row, col):
    style_id = sheet["styles"].get((row, col))
    if style_id is None:
        return None
    fill_id = sheet["styles_table"][style_id].get("fillId")
    return FILL_TO_STATUS.get(fill_id)

def row_has_any_value(sheet, row, max_col):
    return any(str(sheet["cells"].get((row, col), "")).strip() for col in range(1, max_col + 1))

def find_bounds(sheet):
    if not sheet["cells"]:
        return 0, 0
    return (
        max(row for row, _ in sheet["cells"]),
        max(col for _, col in sheet["cells"]),
    )

def find_summary_row(sheet, max_row, max_col):
    nonempty_rows = [row for row in range(1, max_row + 1) if row_has_any_value(sheet, row, max_col)]
    if not nonempty_rows:
        return None

    for row in reversed(nonempty_rows):
        first = str(sheet["cells"].get((row, 1), "")).strip()
        if first.startswith("합산"):
            return row

    header = [sheet["cells"].get((1, col), "") for col in range(1, max_col + 1)]
    try:
        total_col = next(i + 1 for i, value in enumerate(header) if str(value).startswith("합산"))
    except StopIteration:
        total_col = max_col

    last = nonempty_rows[-1]
    first = str(sheet["cells"].get((last, 1), "")).strip()
    has_day_totals = any(str(sheet["cells"].get((last, col), "")).strip() for col in range(2, total_col))
    if first == "" and has_day_totals:
        return last

    return None

def extract_sheet(sheet):
    max_row, max_col = find_bounds(sheet)
    if max_row == 0 or max_col == 0:
        return None

    columns = [sheet["cells"].get((1, col), "") for col in range(1, max_col + 1)]
    if columns and str(columns[0]).strip() == "":
        columns[0] = "닉네임"
    total_index = next((i for i, value in enumerate(columns) if str(value).startswith("합산")), None)
    if total_index is None:
        return None

    total_col = total_index + 1
    day_count = total_index - 1
    summary_row = find_summary_row(sheet, max_row, max_col)

    mode = "wl" if "승률" in str(columns[total_index]) else "count"
    if mode == "count":
        for row in range(2, (summary_row or max_row + 1)):
            for col in range(2, total_col):
                if re.search(r"[WL]", str(sheet["cells"].get((row, col), ""))):
                    mode = "wl"
                    break
            if mode == "wl":
                break

    rows = []
    end_data_row = summary_row - 1 if summary_row else max_row
    for row in range(2, end_data_row + 1):
        name = str(sheet["cells"].get((row, 1), "")).strip()
        if not name:
            continue

        before = [sheet["cells"].get((row, col), "") for col in range(1, total_col)]
        after = [sheet["cells"].get((row, col), "") for col in range(total_col + 1, max_col + 1)]
        status = status_for_cell(sheet, row, 1)

        rows.append({
            "status": status,
            "before": before,
            "after": after,
        })

    if summary_row:
        summary_label = sheet["cells"].get((summary_row, 1), "")
        summary_total = sheet["cells"].get((summary_row, total_col), "")
        summary_after = [sheet["cells"].get((summary_row, col), "") for col in range(total_col + 1, max_col + 1)]
        summary_colors = [status_for_cell(sheet, summary_row, col) for col in range(1, max_col + 1)]
    else:
        summary_label = ""
        summary_total = ""
        summary_after = ["" for _ in range(total_col + 1, max_col + 1)]
        summary_colors = [None for _ in range(max_col)]

    return {
        "columns": columns,
        "mode": mode,
        "tailMode": "status",
        "rows": rows,
        "summary": {
            "label": summary_label,
            "total": summary_total,
            "after": summary_after,
            "colors": summary_colors,
        },
    }

def convert(xlsx_path):
    workbook = read_xlsx(xlsx_path)
    data = {}
    for sheet_name, sheet in workbook.items():
        extracted = extract_sheet(sheet)
        if extracted:
            data[sheet_name] = extracted
    return data

def main():
    if len(sys.argv) < 3:
        print("Usage: xlsx_to_weekly_data.py input.xlsx output.js", file=sys.stderr)
        raise SystemExit(2)
    data = convert(sys.argv[1])
    js = "// Generated from the current Excel workbook. Edit the workbook and rerun xlsx_to_weekly_data.py to refresh.\n"
    js += "window.WEEKLY_DATA = "
    js += json.dumps(data, ensure_ascii=False, indent=2)
    js += ";\n"
    with open(sys.argv[2], "w", encoding="utf-8") as f:
        f.write(js)

if __name__ == "__main__":
    main()
