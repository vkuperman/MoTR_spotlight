#!/usr/bin/env python3
"""
Rebuild fixation_report.csv and interest_area_report.csv from raw_trial_data.csv.

Mirrors run_motr_in_magpie/shared/resultsReports.js (buildFixationReport /
buildInterestAreaReport). Use after stale IndexedDB snapshot uploads left IA /
fixation reports out of sync with raw trial data.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import shutil
from collections import defaultdict
from pathlib import Path
from typing import Any

import pandas as pd

FIXATION_COLUMNS = [
    "participant_id", "SONAId", "Condition", "ItemId", "text_presentation_order", "WordIndex", "Word",
    "responseTime", "mousePositionX", "mousePositionY", "Regression", "clickDurationMs",
    "relativeXInWord", "relativeYInWord",
    "wordPositionTop", "wordPositionLeft", "wordPositionBottom", "wordPositionRight",
    "line_number", "position_in_line", "response", "response_correct", "position_in_text",
    "text_total_viewing_time_ms",
    "saccade_start_x", "saccade_start_y", "saccade_start_time",
    "saccade_end_x", "saccade_end_y", "saccade_end_time", "saccade_length_px",
    "device", "hand", "experiment_date", "experiment_start_date", "experiment_start_time",
    "experiment_start_clock_time", "experiment_start_time_local", "experiment_end_date",
    "experiment_end_time", "experiment_end_clock_time", "experiment_end_time_local",
    "experiment_duration", "experiment_duration_ms",
    "experiment",
]

IA_COLUMNS_BASE = [
    "participant_id", "SONAId", "Condition", "ItemId", "text_presentation_order",
    "word_index", "WordIndex", "word", "response", "response_correct", "line_number", "position_in_line",
    "click_count", "skipped",
    "IA_FIRST_RUN_DWELL_TIME", "IA_DWELL_TIME", "IA_FIRST_FIXATION_DURATION",
    "go_past_time_ms", "IA_REGRESSION_IN", "IA_REGRESSION_OUT",
    "text_total_viewing_time_ms",
    "first_click_x", "first_click_duration_ms", "total_duration_ms", "next_click_regression",
    "first_click_y",
    "x_distance_from_previous_click_px", "x_distance_from_previous_click_chars",
    "first_click_x_from_word_left_chars", "first_click_x_from_word_center_chars",
    "first_click_x_from_line_start_px", "first_click_x_from_line_start_chars",
    "device", "hand", "experiment_date", "experiment_start_date", "experiment_start_time",
    "experiment_start_clock_time", "experiment_start_time_local", "experiment_end_date",
    "experiment_end_time", "experiment_end_clock_time", "experiment_end_time_local",
    "experiment_duration", "experiment_duration_ms",
    "experiment",
]

ONESTOP_IA_COLUMNS = ["onestop_level", "onestop_article_number", "onestop_paragraph_number"]

ONESTOP_LOOKUP_FIELDS = [
    "onestop_level",
    "onestop_article_number",
    "onestop_paragraph_number",
]


def is_blank(v: Any) -> bool:
    if v is None:
        return True
    if isinstance(v, float) and math.isnan(v):
        return True
    return str(v).strip() == ""


def val_str(v: Any) -> str:
    return "" if is_blank(v) else str(v)


def to_num(v: Any) -> float | None:
    if is_blank(v):
        return None
    try:
        n = float(v)
        if math.isnan(n):
            return None
        return n
    except (TypeError, ValueError):
        return None


def is_fixation_row(row: dict[str, Any]) -> bool:
    x = row.get("mousePositionX")
    return not is_blank(x)


def rows_from_dataframe(df: pd.DataFrame) -> list[dict[str, Any]]:
    records = df.to_dict(orient="records")
    out: list[dict[str, Any]] = []
    for row in records:
        cleaned: dict[str, Any] = {}
        for k, v in row.items():
            if isinstance(v, float) and math.isnan(v):
                cleaned[k] = None
            else:
                cleaned[k] = v
        out.append(cleaned)
    return out


def get_response_by_item(all_rows: list[dict[str, Any]]) -> dict[str, str]:
    out: dict[str, str] = {}
    for r in all_rows:
        if not r:
            continue
        item_id = r.get("ItemId")
        if is_blank(item_id):
            item_id = r.get("item_id")
        if is_blank(item_id):
            continue
        item_key = str(item_id)
        resp = r.get("response")
        if resp is None and r.get("responses") is not None:
            resp = str(r.get("responses"))
        if resp is not None and (not is_blank(resp) or item_key not in out):
            out[item_key] = "" if resp is None else str(resp)
    return out


def get_response_correct_by_item(all_rows: list[dict[str, Any]]) -> dict[str, str]:
    out: dict[str, str] = {}
    for r in all_rows:
        if not r:
            continue
        item_id = r.get("ItemId")
        if is_blank(item_id):
            item_id = r.get("item_id")
        if is_blank(item_id):
            continue
        correct = r.get("response_correct")
        if is_blank(correct):
            continue
        out[str(item_id)] = str(correct)
    return out


def get_exp_data_fields(
    exp_data: dict[str, Any],
    all_rows: list[dict[str, Any]],
    session_times: dict[str, Any],
) -> dict[str, str]:
    device = ""
    hand = ""
    subject_from_rows = ""
    for r in reversed(all_rows):
        if not r:
            continue
        if not device and not is_blank(r.get("device")):
            device = str(r.get("device"))
        if not hand and not is_blank(r.get("hand")):
            hand = str(r.get("hand"))
        if device and hand:
            break

    for r in all_rows:
        if not r:
            continue
        for key in ("SONAId", "SubjectId", "SubjectID", "SonaId", "ProlificID", "ProlificId"):
            if not is_blank(r.get(key)):
                subject_from_rows = str(r.get(key))
                break
        if subject_from_rows:
            break

    exp = exp_data or {}
    start_time = exp.get("experiment_start_time") or exp.get("experimentStartTime")
    if is_blank(start_time):
        start_time = (session_times or {}).get("experiment_start_time_fallback", "")
    end_time = (session_times or {}).get("experiment_end_time", "")
    duration = (session_times or {}).get("experiment_duration", "")
    duration_ms = exp.get("experiment_duration_ms")
    if is_blank(duration_ms):
        duration_ms = duration

    sona = exp.get("SONAId")
    if is_blank(sona):
        for key in ("ProlificID", "ProlificId", "SubjectId", "SubjectID"):
            if not is_blank(exp.get(key)):
                sona = exp.get(key)
                break
    if is_blank(sona):
        sona = subject_from_rows

    return {
        "device": val_str(exp.get("device") or device),
        "hand": val_str(exp.get("hand") or hand),
        "SONAId": val_str(sona),
        "experiment": val_str(exp.get("experiment") or exp.get("Experiment") or "spotlight"),
        "experiment_date": val_str(exp.get("experiment_date") or exp.get("experiment_start_date")),
        "experiment_start_date": val_str(exp.get("experiment_start_date") or exp.get("experiment_date")),
        "experiment_start_time": val_str(start_time),
        "experiment_start_clock_time": val_str(exp.get("experiment_start_clock_time")),
        "experiment_start_time_local": val_str(exp.get("experiment_start_time_local")),
        "experiment_end_date": val_str((session_times or {}).get("experiment_end_date") or exp.get("experiment_end_date")),
        "experiment_end_time": val_str(end_time),
        "experiment_end_clock_time": val_str((session_times or {}).get("experiment_end_clock_time") or exp.get("experiment_end_clock_time")),
        "experiment_end_time_local": val_str((session_times or {}).get("experiment_end_time_local") or exp.get("experiment_end_time_local")),
        "experiment_duration": val_str(duration),
        "experiment_duration_ms": val_str(duration_ms),
    }


def build_onestop_lookup(all_rows: list[dict[str, Any]]) -> dict[str, dict[str, str]]:
    lookup: dict[str, dict[str, str]] = {}
    for r in all_rows:
        if not r:
            continue
        item_id = r.get("ItemId")
        if is_blank(item_id):
            continue
        key = str(item_id)
        if key in lookup:
            continue
        fields = {f: val_str(r.get(f)) for f in ONESTOP_LOOKUP_FIELDS if not is_blank(r.get(f))}
        if fields:
            lookup[key] = fields
    return lookup


def build_fixation_report(
    all_rows: list[dict[str, Any]],
    participant_id: str,
    exp_data: dict[str, Any],
    session_times: dict[str, Any],
) -> pd.DataFrame:
    fixation_rows = [r for r in all_rows if is_fixation_row(r)]
    if not fixation_rows:
        return pd.DataFrame(columns=FIXATION_COLUMNS)

    pid = str(participant_id or "")
    exp_fields = get_exp_data_fields(exp_data, all_rows, session_times)
    response_by_item = get_response_by_item(all_rows)
    response_correct_by_item = get_response_correct_by_item(all_rows)

    rows_with_meta: list[dict[str, Any]] = []
    for r in fixation_rows:
        item_id = r.get("ItemId")
        item_key = "NO_ITEM" if is_blank(item_id) else str(item_id)
        row = dict(r)
        row["participant_id"] = pid
        row["position_in_text"] = val_str(r.get("Index"))
        row["response"] = response_by_item.get(item_key, "")
        row["response_correct"] = response_correct_by_item.get(item_key, "")
        row.update(exp_fields)
        rows_with_meta.append(row)

    by_item: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows_with_meta:
        item_key = "NO_ITEM" if is_blank(row.get("ItemId")) else str(row.get("ItemId"))
        by_item[item_key].append(row)

    for item_id, group in by_item.items():
        group.sort(key=lambda r: to_num(r.get("responseTime")) or 0)
        prev_x = None
        for r in group:
            x = to_num(r.get("mousePositionX"))
            regression = "1" if prev_x is not None and x is not None and x < prev_x else "0"
            if x is not None:
                prev_x = x
            r["Regression"] = regression

        times = [to_num(r.get("responseTime")) for r in group]
        times = [t for t in times if t is not None]
        text_total = str(round(max(times) - min(times))) if len(times) >= 2 else ""
        for r in group:
            r["text_total_viewing_time_ms"] = text_total

        for i, r in enumerate(group):
            r["saccade_start_x"] = r.get("mousePositionX")
            r["saccade_start_y"] = r.get("mousePositionY")
            r["saccade_start_time"] = r.get("responseTime")
            if i < len(group) - 1:
                nxt = group[i + 1]
                r["saccade_end_x"] = nxt.get("mousePositionX")
                r["saccade_end_y"] = nxt.get("mousePositionY")
                r["saccade_end_time"] = nxt.get("responseTime")
                sx, sy = to_num(r.get("mousePositionX")), to_num(r.get("mousePositionY"))
                ex, ey = to_num(nxt.get("mousePositionX")), to_num(nxt.get("mousePositionY"))
                if None not in (sx, sy, ex, ey):
                    r["saccade_length_px"] = f"{math.hypot(ex - sx, ey - sy):.2f}"
                else:
                    r["saccade_length_px"] = ""
            else:
                r["saccade_end_x"] = ""
                r["saccade_end_y"] = ""
                r["saccade_end_time"] = ""
                r["saccade_length_px"] = ""

    rows_for_csv: list[dict[str, str]] = []
    for row in rows_with_meta:
        out = {col: "" for col in FIXATION_COLUMNS}
        out["participant_id"] = pid
        out["SONAId"] = val_str(row.get("SONAId"))
        out["Condition"] = val_str(row.get("Condition"))
        out["ItemId"] = val_str(row.get("ItemId"))
        po = to_num(row.get("presentation_order"))
        out["text_presentation_order"] = "" if po is None else str(int(po))
        out["WordIndex"] = val_str(row.get("Index"))
        out["Word"] = val_str(row.get("Word"))
        out["responseTime"] = val_str(row.get("responseTime"))
        out["mousePositionX"] = val_str(row.get("mousePositionX"))
        out["mousePositionY"] = val_str(row.get("mousePositionY"))
        out["Regression"] = val_str(row.get("Regression"))
        out["clickDurationMs"] = val_str(row.get("clickDurationMs"))
        out["relativeXInWord"] = val_str(row.get("relativeXInWord"))
        out["relativeYInWord"] = val_str(row.get("relativeYInWord"))
        out["wordPositionTop"] = val_str(row.get("wordPositionTop"))
        out["wordPositionLeft"] = val_str(row.get("wordPositionLeft"))
        out["wordPositionBottom"] = val_str(row.get("wordPositionBottom"))
        out["wordPositionRight"] = val_str(row.get("wordPositionRight"))
        out["line_number"] = val_str(row.get("line_number"))
        out["position_in_line"] = val_str(row.get("position_in_line"))
        out["response"] = val_str(row.get("response"))
        out["response_correct"] = val_str(row.get("response_correct"))
        out["position_in_text"] = val_str(row.get("position_in_text"))
        out["text_total_viewing_time_ms"] = val_str(row.get("text_total_viewing_time_ms"))
        out["saccade_start_x"] = val_str(row.get("saccade_start_x"))
        out["saccade_start_y"] = val_str(row.get("saccade_start_y"))
        out["saccade_start_time"] = val_str(row.get("saccade_start_time"))
        out["saccade_end_x"] = val_str(row.get("saccade_end_x"))
        out["saccade_end_y"] = val_str(row.get("saccade_end_y"))
        out["saccade_end_time"] = val_str(row.get("saccade_end_time"))
        out["saccade_length_px"] = val_str(row.get("saccade_length_px"))
        for k in (
            "device", "hand", "experiment_date", "experiment_start_date", "experiment_start_time",
            "experiment_start_clock_time", "experiment_start_time_local", "experiment_end_date",
            "experiment_end_time", "experiment_end_clock_time", "experiment_end_time_local",
            "experiment_duration", "experiment_duration_ms", "experiment",
        ):
            out[k] = val_str(row.get(k))
        rows_for_csv.append(out)

    rows_for_csv.sort(
        key=lambda r: (
            float(r["text_presentation_order"]) if r["text_presentation_order"] else float("inf"),
            float(r["responseTime"]) if r["responseTime"] else float("inf"),
        )
    )
    return pd.DataFrame(rows_for_csv, columns=FIXATION_COLUMNS)


def build_interest_area_report(
    all_rows: list[dict[str, Any]],
    participant_id: str,
    exp_data: dict[str, Any],
    session_times: dict[str, Any],
    onestop_lookup: dict[str, dict[str, str]],
) -> pd.DataFrame:
    fixation_rows = [r for r in all_rows if is_fixation_row(r)]
    if not fixation_rows:
        return pd.DataFrame()

    pid = str(participant_id or "")
    exp_fields = get_exp_data_fields(exp_data, all_rows, session_times)
    response_by_item = get_response_by_item(all_rows)
    response_correct_by_item = get_response_correct_by_item(all_rows)

    by_item: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in fixation_rows:
        item_key = "NO_ITEM" if is_blank(row.get("ItemId")) else str(row.get("ItemId"))
        by_item[item_key].append(row)

    first_time_by_item = {
        item_id: min(to_num(r.get("responseTime")) or 0 for r in rows)
        for item_id, rows in by_item.items()
    }
    presentation_order_by_item: dict[str, int] = {}
    for item_id, rows in by_item.items():
        for r in rows:
            po = to_num(r.get("presentation_order"))
            if po is not None:
                presentation_order_by_item[item_id] = int(po)
                break

    sorted_item_ids = sorted(
        by_item.keys(),
        key=lambda item_id: (
            presentation_order_by_item.get(item_id, 10**9),
            first_time_by_item.get(item_id, 0),
        ),
    )

    report_rows: list[dict[str, Any]] = []
    item_order_counter = 0
    for item_id in sorted_item_ids:
        item_order_counter += 1
        rows = list(by_item[item_id])
        from_total = max([0] + [int(to_num(r.get("totalWordsInItem")) or 0) for r in rows if (to_num(r.get("totalWordsInItem")) or 0) > 0])
        from_max = max([0] + [int(to_num(r.get("Index")) or 0) for r in rows if (to_num(r.get("Index")) or 0) >= 1])
        total_words = from_total if from_total > 0 else from_max

        rows.sort(key=lambda r: to_num(r.get("responseTime")) or 0)
        times = [to_num(r.get("responseTime")) for r in rows]
        times = [t for t in times if t is not None]
        text_total_viewing_ms = round(max(times) - min(times)) if len(times) >= 2 else ""

        word_indices = set(range(1, total_words + 1))
        for r in rows:
            idx = to_num(r.get("Index"))
            if idx is not None and idx >= 1:
                word_indices.add(int(idx))

        for word_index in sorted(word_indices):
            clicks = [r for r in rows if to_num(r.get("Index")) == word_index]
            click_count = len(clicks)
            skipped = click_count == 0
            first_click = clicks[0] if clicks else None
            last_click = clicks[-1] if clicks else None

            metrics = {
                "first_click_x": "",
                "first_click_y": "",
                "first_click_duration_ms": "",
                "total_duration_ms": "",
                "next_click_regression": "",
                "first_run_dwell_ms": "",
                "go_past_time_ms": "",
                "regression_in": "",
                "regression_out": "",
                "x_distance_from_previous_click_px": "",
                "x_distance_from_previous_click_chars": "",
                "first_click_x_from_word_left_chars": "",
                "first_click_x_from_word_center_chars": "",
                "first_click_x_from_line_start_px": "",
                "first_click_x_from_line_start_chars": "",
                "word_text": "",
                "line_number": "",
                "position_in_line": "",
            }

            if first_click:
                fc = first_click
                metrics["line_number"] = val_str(fc.get("line_number"))
                metrics["position_in_line"] = val_str(fc.get("position_in_line"))
                metrics["first_click_x"] = fc.get("mousePositionX")
                metrics["first_click_y"] = fc.get("mousePositionY")
                metrics["first_click_duration_ms"] = fc.get("clickDurationMs")
                total_duration = sum(to_num(c.get("clickDurationMs")) or 0 for c in clicks)
                metrics["total_duration_ms"] = total_duration
                metrics["word_text"] = val_str(fc.get("Word"))

                word_left = to_num(fc.get("wordPositionLeft"))
                word_right = to_num(fc.get("wordPositionRight"))
                word_len = len(str(fc.get("Word") or "")) or 1
                char_width = None
                if word_left is not None and word_right is not None and word_right > word_left:
                    char_width = (word_right - word_left) / word_len

                mouse_x = to_num(fc.get("mousePositionX"))
                if char_width and char_width > 0 and mouse_x is not None and word_left is not None:
                    metrics["first_click_x_from_word_left_chars"] = f"{(mouse_x - word_left) / char_width:.4f}"
                    center_x = (word_left + word_right) / 2
                    metrics["first_click_x_from_word_center_chars"] = f"{(mouse_x - center_x) / char_width:.4f}"

                if not is_blank(fc.get("xFromLineStartPx")):
                    metrics["first_click_x_from_line_start_px"] = f"{float(fc.get('xFromLineStartPx')):.2f}"
                if not is_blank(fc.get("xFromLineStartChars")):
                    metrics["first_click_x_from_line_start_chars"] = f"{float(fc.get('xFromLineStartChars')):.4f}"

                if metrics["first_click_x_from_line_start_px"] == "" and not is_blank(fc.get("line_number")):
                    same_line = [
                        r for r in rows
                        if str(r.get("line_number")) == str(fc.get("line_number"))
                        and not is_blank(r.get("wordPositionLeft"))
                    ]
                    if same_line:
                        line_start_x = min(to_num(r.get("wordPositionLeft")) or float("inf") for r in same_line)
                        if mouse_x is not None and math.isfinite(line_start_x):
                            x_from_line = mouse_x - line_start_x
                            metrics["first_click_x_from_line_start_px"] = f"{x_from_line:.2f}"
                            if char_width and char_width > 0:
                                metrics["first_click_x_from_line_start_chars"] = f"{x_from_line / char_width:.4f}"

                prev_clicks = [
                    r for r in rows
                    if (to_num(r.get("responseTime")) or 0) < (to_num(fc.get("responseTime")) or 0)
                    and to_num(r.get("Index")) != word_index
                ]
                if prev_clicks and mouse_x is not None:
                    prev = prev_clicks[-1]
                    prev_x = to_num(prev.get("mousePositionX"))
                    if prev_x is not None:
                        dist = mouse_x - prev_x
                        metrics["x_distance_from_previous_click_px"] = f"{dist:.2f}"
                        if char_width and char_width > 0:
                            metrics["x_distance_from_previous_click_chars"] = f"{dist / char_width:.4f}"

                if last_click:
                    next_clicks = [
                        r for r in rows
                        if (to_num(r.get("responseTime")) or 0) > (to_num(last_click.get("responseTime")) or 0)
                        and to_num(r.get("Index")) != word_index
                    ]
                    if next_clicks:
                        nxt = next_clicks[0]
                        nxt_idx = to_num(nxt.get("Index"))
                        if nxt_idx is not None:
                            metrics["next_click_regression"] = "1" if nxt_idx < word_index else "0"

                in_first_run = False
                first_run_done = False
                first_run_sum = 0.0
                for r in rows:
                    idx = to_num(r.get("Index"))
                    if idx == word_index:
                        if not first_run_done:
                            in_first_run = True
                            first_run_sum += to_num(r.get("clickDurationMs")) or 0
                    else:
                        if in_first_run:
                            first_run_done = True
                        in_first_run = False
                if first_run_sum > 0:
                    metrics["first_run_dwell_ms"] = str(round(first_run_sum))

                first_click_time = min(to_num(c.get("responseTime")) or float("inf") for c in clicks)
                forward_exit_times = [
                    to_num(r.get("responseTime")) or float("inf")
                    for r in rows
                    if (to_num(r.get("Index")) or 0) > word_index
                    and (to_num(r.get("responseTime")) or 0) > first_click_time
                ]
                first_forward_exit = min(forward_exit_times) if forward_exit_times else float("inf")
                if math.isfinite(first_forward_exit):
                    gp_sum = sum(
                        to_num(c.get("clickDurationMs")) or 0
                        for c in clicks
                        if (to_num(c.get("responseTime")) or 0) < first_forward_exit
                    )
                    metrics["go_past_time_ms"] = str(round(gp_sum))
                elif metrics["total_duration_ms"] != "":
                    metrics["go_past_time_ms"] = str(round(float(metrics["total_duration_ms"])))

                regression_in = ""
                for c in clicks:
                    prev_all = [r for r in rows if (to_num(r.get("responseTime")) or 0) < (to_num(c.get("responseTime")) or 0)]
                    prev = prev_all[-1] if prev_all else None
                    if prev and (to_num(prev.get("Index")) or 0) > word_index:
                        regression_in = "1"
                        break
                metrics["regression_in"] = regression_in or "0"

                regression_out = ""
                for c in clicks:
                    next_all = [r for r in rows if (to_num(r.get("responseTime")) or 0) > (to_num(c.get("responseTime")) or 0)]
                    nxt = next_all[0] if next_all else None
                    if nxt and (to_num(nxt.get("Index")) or 0) < word_index:
                        regression_out = "1"
                        break
                metrics["regression_out"] = regression_out or "0"

            experiment = val_str(rows[0].get("Experiment"))
            condition = val_str(rows[0].get("Condition"))
            onestop = onestop_lookup.get(item_id, {})

            report_rows.append({
                "participant_id": pid,
                "SONAId": exp_fields["SONAId"],
                "Condition": condition,
                "onestop_level": onestop.get("onestop_level", ""),
                "onestop_article_number": onestop.get("onestop_article_number", ""),
                "onestop_paragraph_number": onestop.get("onestop_paragraph_number", ""),
                "ItemId": item_id,
                "text_presentation_order": presentation_order_by_item.get(item_id, item_order_counter),
                "word_index": word_index,
                "WordIndex": word_index,
                "word": metrics["word_text"] if click_count > 0 else "",
                "response": response_by_item.get(item_id, ""),
                "response_correct": response_correct_by_item.get(item_id, ""),
                "line_number": metrics["line_number"],
                "position_in_line": metrics["position_in_line"],
                "click_count": click_count,
                "skipped": "1" if skipped else "0",
                "IA_FIRST_RUN_DWELL_TIME": metrics["first_run_dwell_ms"],
                "IA_DWELL_TIME": metrics["total_duration_ms"],
                "IA_FIRST_FIXATION_DURATION": metrics["first_click_duration_ms"],
                "go_past_time_ms": metrics["go_past_time_ms"],
                "IA_REGRESSION_IN": metrics["regression_in"],
                "IA_REGRESSION_OUT": metrics["regression_out"],
                "text_total_viewing_time_ms": "" if text_total_viewing_ms == "" else str(text_total_viewing_ms),
                "first_click_x": metrics["first_click_x"],
                "first_click_duration_ms": metrics["first_click_duration_ms"],
                "total_duration_ms": metrics["total_duration_ms"],
                "next_click_regression": metrics["next_click_regression"],
                "first_click_y": metrics["first_click_y"],
                "x_distance_from_previous_click_px": metrics["x_distance_from_previous_click_px"],
                "x_distance_from_previous_click_chars": metrics["x_distance_from_previous_click_chars"],
                "first_click_x_from_word_left_chars": metrics["first_click_x_from_word_left_chars"],
                "first_click_x_from_word_center_chars": metrics["first_click_x_from_word_center_chars"],
                "first_click_x_from_line_start_px": metrics["first_click_x_from_line_start_px"],
                "first_click_x_from_line_start_chars": metrics["first_click_x_from_line_start_chars"],
                **{k: exp_fields[k] for k in exp_fields if k not in ("SONAId",)},
                "experiment": exp_fields["experiment"] or experiment,
            })

    if not report_rows:
        return pd.DataFrame()

    ia_columns = IA_COLUMNS_BASE[:3] + ONESTOP_IA_COLUMNS + IA_COLUMNS_BASE[3:]
    df = pd.DataFrame(report_rows)
    for col in ia_columns:
        if col not in df.columns:
            df[col] = ""
    df = df[ia_columns]
    df = df.sort_values(
        by=["text_presentation_order", "word_index"],
        key=lambda s: pd.to_numeric(s, errors="coerce").fillna(10**9),
    )
    return df


def resolve_participant_id(session_dir: Path, all_rows: list[dict[str, Any]]) -> str:
    session_json = session_dir / "session_complete.json"
    if session_json.exists():
        try:
            payload = json.loads(session_json.read_text(encoding="utf-8"))
            pid = payload.get("participantId")
            if not is_blank(pid):
                return str(pid)
        except (OSError, json.JSONDecodeError):
            pass

    m = re.match(r"motr_results_([^_]+)_", session_dir.name)
    if m:
        return m.group(1)

    for r in all_rows:
        if not is_blank(r.get("ParticipantId")):
            return str(r.get("ParticipantId"))
    return "unknown"


def rebuild_session_dir(session_dir: Path, backup: bool = True, dry_run: bool = False) -> dict[str, Any]:
    raw_path = session_dir / "raw_trial_data.csv"
    if not raw_path.exists():
        return {"session_dir": str(session_dir), "status": "skipped", "reason": "no raw_trial_data.csv"}

    df = pd.read_csv(raw_path, low_memory=False)
    all_rows = rows_from_dataframe(df)
    participant_id = resolve_participant_id(session_dir, all_rows)
    onestop_lookup = build_onestop_lookup(all_rows)

    session_times = {"experiment_start_time_fallback": ""}
    for r in all_rows:
        if not is_blank(r.get("experiment_start_time")):
            session_times["experiment_start_time_fallback"] = str(r.get("experiment_start_time"))
            break

    exp_data = {}
    for key in (
        "experiment_start_time", "experiment_end_time", "experiment_duration", "experiment_duration_ms",
        "SONAId", "device", "hand", "experiment", "Experiment",
    ):
        for r in reversed(all_rows):
            if not is_blank(r.get(key)):
                exp_data[key] = r.get(key)
                break

    fixation_df = build_fixation_report(all_rows, participant_id, exp_data, session_times)
    ia_df = build_interest_area_report(all_rows, participant_id, exp_data, session_times, onestop_lookup)

    old_fix = session_dir / "fixation_report.csv"
    old_ia = session_dir / "interest_area_report.csv"
    old_fix_rows = len(pd.read_csv(old_fix)) if old_fix.exists() else 0
    old_ia_clicks = 0
    if old_ia.exists():
        old_ia_df = pd.read_csv(old_ia, low_memory=False)
        if "click_count" in old_ia_df.columns:
            old_ia_clicks = int(pd.to_numeric(old_ia_df["click_count"], errors="coerce").fillna(0).sum())

    summary = {
        "session_dir": str(session_dir),
        "status": "dry_run" if dry_run else "rebuilt",
        "participant_id": participant_id,
        "raw_fixation_rows": sum(1 for r in all_rows if is_fixation_row(r)),
        "fixation_rows_old": old_fix_rows,
        "fixation_rows_new": len(fixation_df),
        "ia_click_count_old": old_ia_clicks,
        "ia_click_count_new": int(pd.to_numeric(ia_df.get("click_count", pd.Series(dtype=float)), errors="coerce").fillna(0).sum()) if len(ia_df) else 0,
    }

    if dry_run:
        return summary

    if backup:
        for path in (old_fix, old_ia):
            if path.exists():
                bak = path.with_name(path.stem + ".pre_rebuild_bak" + path.suffix)
                shutil.copy2(path, bak)

    def write_csv(df: pd.DataFrame, primary: Path, fallback: Path) -> str:
        try:
            df.to_csv(primary, index=False)
            return str(primary.name)
        except OSError as exc:
            df.to_csv(fallback, index=False)
            return f"{fallback.name} (primary locked: {exc})"

    fix_written = write_csv(
        fixation_df,
        session_dir / "fixation_report.csv",
        session_dir / "fixation_report_rebuilt.csv",
    )
    ia_written = write_csv(
        ia_df,
        session_dir / "interest_area_report.csv",
        session_dir / "interest_area_report_rebuilt.csv",
    )
    summary["fixation_written"] = fix_written
    summary["interest_area_written"] = ia_written
    return summary


def find_session_dirs(results_dir: Path) -> list[Path]:
    dirs: list[Path] = []
    for path in sorted(results_dir.rglob("raw_trial_data.csv")):
        session_dir = path.parent
        if session_dir.is_dir():
            dirs.append(session_dir)
    # De-duplicate while preserving order.
    seen: set[Path] = set()
    unique_dirs: list[Path] = []
    for d in dirs:
        if d not in seen:
            seen.add(d)
            unique_dirs.append(d)
    return unique_dirs


def main() -> None:
    parser = argparse.ArgumentParser(description="Rebuild fixation/IA CSVs from raw_trial_data.csv")
    parser.add_argument(
        "results_dir",
        nargs="?",
        default="Results",
        help="Directory containing motr_results_* session folders",
    )
    parser.add_argument("--no-backup", action="store_true", help="Do not keep .pre_rebuild_bak copies")
    parser.add_argument("--dry-run", action="store_true", help="Print summary only")
    args = parser.parse_args()

    results_dir = Path(args.results_dir).resolve()
    if not results_dir.exists():
        raise SystemExit(f"Results directory not found: {results_dir}")

    session_dirs = find_session_dirs(results_dir)
    if not session_dirs:
        print(f"No raw_trial_data.csv files found under {results_dir}")
        return

    rebuilt = 0
    for session_dir in session_dirs:
        summary = rebuild_session_dir(session_dir, backup=not args.no_backup, dry_run=args.dry_run)
        extra = ""
        if summary.get("interest_area_written"):
            extra = f" | wrote {summary.get('interest_area_written')}"
        print(
            f"{summary['status']:8} {session_dir.name}: "
            f"fixation {summary.get('fixation_rows_old', '?')} -> {summary.get('fixation_rows_new', '?')}, "
            f"IA clicks {summary.get('ia_click_count_old', '?')} -> {summary.get('ia_click_count_new', '?')}"
            f"{extra}"
        )
        if summary.get("status") == "rebuilt":
            rebuilt += 1

    print(f"Done. Processed {len(session_dirs)} session folder(s); rebuilt {rebuilt}.")


if __name__ == "__main__":
    main()
