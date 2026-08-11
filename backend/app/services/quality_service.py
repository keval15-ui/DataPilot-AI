import os
import re
from typing import Any

import numpy as np
import pandas as pd


# ============================================================
# Constants
# ============================================================

EMAIL_PATTERN = re.compile(
    r"^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@"
    r"[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?"
    r"(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$"
)

CURRENCY_PATTERN = re.compile(
    r"^\s*"
    r"(?:[$€£₹¥]|USD|EUR|GBP|INR|JPY|CAD|AUD)?"
    r"\s*"
    r"[-+]?"
    r"(?:\d{1,3}(?:,\d{3})+|\d+)"
    r"(?:\.\d+)?"
    r"\s*"
    r"(?:USD|EUR|GBP|INR|JPY|CAD|AUD)?"
    r"\s*$",
    re.IGNORECASE,
)

NUMBER_PATTERN = re.compile(
    r"^\s*[-+]?"
    r"(?:\d{1,3}(?:,\d{3})+|\d+)"
    r"(?:\.\d+)?\s*$"
)

DATE_COLUMN_NAME_HINTS = {
    "date",
    "datetime",
    "timestamp",
    "time",
    "created",
    "updated",
    "dob",
    "birth",
    "start",
    "end",
    "joined",
    "joining",
    "signup",
    "registered",
}

EMAIL_COLUMN_NAME_HINTS = {
    "email",
    "e_mail",
    "mail",
    "email_address",
}

ID_COLUMN_NAME_HINTS = {
    "id",
    "code",
    "number",
    "no",
    "key",
}


# ============================================================
# General Helpers
# ============================================================

def _safe_value(value: Any) -> Any:
    """
    Convert NumPy/Pandas values into JSON-safe Python values.
    """

    if pd.isna(value):
        return None

    if isinstance(value, np.integer):
        return int(value)

    if isinstance(value, np.floating):
        if np.isnan(value) or np.isinf(value):
            return None
        return float(value)

    if isinstance(value, np.bool_):
        return bool(value)

    if isinstance(value, pd.Timestamp):
        return value.isoformat()

    return value


def _clean_string_series(series: pd.Series) -> pd.Series:
    """
    Return non-null values converted to strings.
    """

    return (
        series.dropna()
        .astype(str)
    )


def _normalize_text(value: Any) -> str:
    """
    Normalize a value for comparison.

    Example:

        ' UPI '
        'upi'
        'UPI'

    all become:

        'upi'
    """

    return str(value).strip().casefold()


# ============================================================
# Dataset Loading
# ============================================================

def _load_dataset(file_path: str) -> pd.DataFrame:
    """
    Load CSV or Excel dataset.

    This function is READ-ONLY.
    """

    if not file_path:
        raise ValueError(
            "Dataset file path is missing."
        )

    if not os.path.exists(file_path):
        raise FileNotFoundError(
            f"Dataset file not found: {file_path}"
        )

    extension = os.path.splitext(
        file_path
    )[1].lower()

    if extension == ".csv":

        try:
            return pd.read_csv(file_path)

        except UnicodeDecodeError:
            try:
                return pd.read_csv(
                    file_path,
                    encoding="latin1",
                )
            except Exception as exc:
                raise ValueError(
                    f"Unable to read CSV file: {exc}"
                )

        except Exception as exc:
            raise ValueError(
                f"Unable to read CSV file: {exc}"
            )

    if extension in {".xlsx", ".xls"}:

        try:
            return pd.read_excel(file_path)

        except Exception as exc:
            raise ValueError(
                f"Unable to read Excel file: {exc}"
            )

    if extension in {
        ".db",
        ".sqlite",
        ".sqlite3",
    }:
        raise ValueError(
            "SQLite quality scanning is not supported yet."
        )

    raise ValueError(
        f"Unsupported dataset format: {extension}"
    )


# ============================================================
# Column Name Analysis
# ============================================================

def _check_column_name(
    column_name: str,
) -> list[dict[str, Any]]:

    issues = []

    if not column_name.strip():
        issues.append(
            {
                "type": "empty_column_name",
                "severity": "problem",
                "message": "Column name is empty.",
            }
        )

        return issues

    if column_name != column_name.strip():
        issues.append(
            {
                "type": "column_name_whitespace",
                "severity": "warning",
                "message": (
                    "Column name contains leading or trailing whitespace."
                ),
            }
        )

    if any(
        char in column_name
        for char in [
            " ",
            "-",
            "/",
            "\\",
            "?",
            "(",
            ")",
            ".",
        ]
    ):
        issues.append(
            {
                "type": "sql_column_name",
                "severity": "warning",
                "message": (
                    "Column name contains characters that may "
                    "require quoting or normalization for SQL."
                ),
            }
        )

    if column_name[0].isdigit():
        issues.append(
            {
                "type": "sql_column_name",
                "severity": "warning",
                "message": (
                    "Column name starts with a number and may "
                    "require quoting in SQL."
                ),
            }
        )

    return issues


# ============================================================
# Missing Values
# ============================================================

def _check_missing_values(
    series: pd.Series,
) -> tuple[int, list[dict[str, Any]]]:

    missing_count = int(
        series.isna().sum()
    )

    issues = []

    if missing_count > 0:

        issues.append(
            {
                "type": "missing_values",
                "severity": "warning",
                "count": missing_count,
                "message": (
                    f"{missing_count} missing values detected."
                ),
            }
        )

    return missing_count, issues


# ============================================================
# Empty / Constant Columns
# ============================================================

def _check_empty_or_constant(
    series: pd.Series,
) -> list[dict[str, Any]]:

    issues = []

    non_null = series.dropna()

    if len(non_null) == 0:

        issues.append(
            {
                "type": "empty_column",
                "severity": "problem",
                "message": (
                    "Column contains no usable values."
                ),
            }
        )

        return issues

    unique_count = int(
        non_null.nunique()
    )

    if unique_count == 1:

        issues.append(
            {
                "type": "constant_column",
                "severity": "warning",
                "message": (
                    "Column contains only one unique value."
                ),
            }
        )

    return issues


# ============================================================
# Whitespace Inconsistency
# ============================================================

def _check_whitespace(
    series: pd.Series,
) -> tuple[int, list[dict[str, Any]]]:

    values = _clean_string_series(series)

    if values.empty:
        return 0, []

    stripped = values.str.strip()

    affected_mask = values != stripped

    affected_count = int(
        affected_mask.sum()
    )

    issues = []

    if affected_count > 0:

        examples = (
            values[affected_mask]
            .drop_duplicates()
            .head(5)
            .tolist()
        )

        issues.append(
            {
                "type": "whitespace_inconsistency",
                "severity": "warning",
                "count": affected_count,
                "examples": examples,
                "message": (
                    f"{affected_count} values contain "
                    "leading or trailing whitespace."
                ),
            }
        )

    return affected_count, issues


# ============================================================
# Case / Categorical Inconsistency
# ============================================================

def _check_categorical_consistency(
    series: pd.Series,
) -> list[dict[str, Any]]:

    values = _clean_string_series(series)

    if values.empty:
        return []

    # Only meaningful for columns with a reasonable number
    # of repeated categorical values.
    unique_values = values.nunique()

    if unique_values <= 1:
        return []

    if unique_values > 100:
        return []

    normalized = values.map(
        _normalize_text
    )

    groups: dict[str, set[str]] = {}

    for original, normal in zip(
        values,
        normalized,
    ):
        groups.setdefault(
            normal,
            set(),
        ).add(original)

    inconsistent_groups = [
        {
            "normalized_value": key,
            "variants": sorted(list(variants)),
        }
        for key, variants in groups.items()
        if len(variants) > 1
    ]

    if not inconsistent_groups:
        return []

    affected_count = 0

    for group in inconsistent_groups:

        variant_set = set(
            group["variants"]
        )

        affected_count += int(
            values.isin(variant_set).sum()
        )

    examples = inconsistent_groups[:10]

    return [
        {
            "type": "categorical_inconsistency",
            "severity": "warning",
            "count": affected_count,
            "groups": examples,
            "message": (
                "Multiple values differ only by "
                "capitalization and/or whitespace."
            ),
        }
    ]


# ============================================================
# Email Detection
# ============================================================

def _email_likeness(
    series: pd.Series,
    column_name: str,
) -> float:

    values = _clean_string_series(series)

    if values.empty:
        return 0.0

    name_hint = any(
        token in column_name.lower()
        for token in EMAIL_COLUMN_NAME_HINTS
    )

    contains_at = (
        values.str.contains(
            "@",
            regex=False,
            na=False,
        ).mean()
    )

    valid_email_ratio = (
        values.map(
            lambda value: bool(
                EMAIL_PATTERN.match(
                    value.strip()
                )
            )
        ).mean()
    )

    if name_hint:
        return max(
            0.8,
            float(valid_email_ratio),
        )

    return float(
        max(
            contains_at,
            valid_email_ratio,
        )
    )


def _check_email_column(
    series: pd.Series,
    column_name: str,
) -> list[dict[str, Any]]:

    values = _clean_string_series(series)

    if values.empty:
        return []

    likelihood = _email_likeness(
        series,
        column_name,
    )

    if likelihood < 0.5:
        return []

    invalid_values = []

    for value in values:

        if not EMAIL_PATTERN.match(
            value.strip()
        ):
            invalid_values.append(value)

    if not invalid_values:
        return []

    unique_examples = (
        pd.Series(invalid_values)
        .drop_duplicates()
        .head(10)
        .tolist()
    )

    return [
        {
            "type": "invalid_email",
            "severity": "problem",
            "count": len(invalid_values),
            "examples": unique_examples,
            "message": (
                f"{len(invalid_values)} values do not "
                "match a valid email format."
            ),
        }
    ]


# ============================================================
# Numeric / Currency Detection
# ============================================================

def _numeric_likeness(
    series: pd.Series,
) -> float:

    values = _clean_string_series(series)

    if values.empty:
        return 0.0

    numeric_count = sum(
        bool(NUMBER_PATTERN.match(value))
        for value in values
    )

    return numeric_count / len(values)


def _currency_likeness(
    series: pd.Series,
) -> float:

    values = _clean_string_series(series)

    if values.empty:
        return 0.0

    currency_count = sum(
        bool(CURRENCY_PATTERN.match(value))
        for value in values
    )

    return currency_count / len(values)


def _check_numeric_consistency(
    series: pd.Series,
) -> list[dict[str, Any]]:

    if pd.api.types.is_numeric_dtype(series):
        return []

    values = _clean_string_series(series)

    if values.empty:
        return []

    numeric_ratio = _numeric_likeness(
        series
    )

    currency_ratio = _currency_likeness(
        series
    )

    # Only inspect as numeric-like when the majority
    # of values appear numeric/currency.
    if max(
        numeric_ratio,
        currency_ratio,
    ) < 0.5:
        return []

    invalid_values = []

    for value in values:

        normalized = (
            value
            .replace(",", "")
            .replace("$", "")
            .replace("€", "")
            .replace("£", "")
            .replace("₹", "")
            .replace("¥", "")
        )

        normalized = re.sub(
            r"\b(USD|EUR|GBP|INR|JPY|CAD|AUD)\b",
            "",
            normalized,
            flags=re.IGNORECASE,
        ).strip()

        try:
            float(normalized)

        except ValueError:
            invalid_values.append(value)

    if not invalid_values:
        return []

    examples = (
        pd.Series(invalid_values)
        .drop_duplicates()
        .head(10)
        .tolist()
    )

    return [
        {
            "type": "mixed_numeric_values",
            "severity": "warning",
            "count": len(invalid_values),
            "examples": examples,
            "message": (
                f"{len(invalid_values)} values cannot "
                "be interpreted consistently as numeric."
            ),
        }
    ]


# ============================================================
# Date Detection
# ============================================================

def _date_likeness(
    series: pd.Series,
    column_name: str,
) -> float:
    values = _clean_string_series(series)

    if values.empty:
        return 0.0

    name_lower = column_name.lower()

    name_hint = any(
        token in name_lower
        for token in DATE_COLUMN_NAME_HINTS
    )

    # --------------------------------------------------------
    # IMPORTANT:
    # Never automatically detect a numeric column as a date.
    # Numeric columns such as age, balance, duration, day,
    # campaign, pdays, and previous must remain numeric.
    # --------------------------------------------------------
    if pd.api.types.is_numeric_dtype(series) and not name_hint:
        return 0.0

    # Try parsing only when the column is appropriate for
    # date detection.
    parsed = pd.to_datetime(
        values,
        errors="coerce",
    )

    parse_ratio = (
        parsed.notna().sum()
        / len(values)
    )

    if name_hint:
        return max(
            0.8,
            float(parse_ratio),
        )

    return float(parse_ratio)

    # Try parsing without forcing a format.
    parsed = pd.to_datetime(
        values,
        errors="coerce",
    )

    parse_ratio = (
        parsed.notna().sum()
        / len(values)
    )

    if name_hint:
        return max(
            0.8,
            float(parse_ratio),
        )

    return float(parse_ratio)


def _check_date_column(
    series: pd.Series,
    column_name: str,
) -> list[dict[str, Any]]:

    values = _clean_string_series(series)

    if values.empty:
        return []

    likelihood = _date_likeness(
        series,
        column_name,
    )

    if likelihood < 0.7:
        return []

    parsed = pd.to_datetime(
        values,
        errors="coerce",
    )

    invalid_mask = parsed.isna()

    invalid_count = int(
        invalid_mask.sum()
    )

    issues = []

    if invalid_count > 0:

        examples = (
            values[invalid_mask]
            .drop_duplicates()
            .head(10)
            .tolist()
        )

        issues.append(
            {
                "type": "invalid_date",
                "severity": "problem",
                "count": invalid_count,
                "examples": examples,
                "message": (
                    f"{invalid_count} values could not "
                    "be interpreted as dates."
                ),
            }
        )

    # Detect multiple common date representations.
    formats = set()

    for value in values.head(500):

        if re.match(
            r"^\d{4}-\d{1,2}-\d{1,2}",
            value,
        ):
            formats.add("YYYY-MM-DD")

        elif re.match(
            r"^\d{1,2}/\d{1,2}/\d{4}",
            value,
        ):
            formats.add("DD/MM/YYYY or MM/DD/YYYY")

        elif re.match(
            r"^\d{1,2}-\d{1,2}-\d{4}",
            value,
        ):
            formats.add("DD-MM-YYYY or MM-DD-YYYY")

        elif re.match(
            r"^\d{1,2}\.\d{1,2}\.\d{4}",
            value,
        ):
            formats.add("DD.MM.YYYY")

    if len(formats) > 1:

        issues.append(
            {
                "type": "mixed_date_formats",
                "severity": "warning",
                "formats_detected": sorted(
                    formats
                ),
                "message": (
                    "Multiple date formats were detected "
                    "within this column."
                ),
            }
        )

    return issues


# ============================================================
# Outlier Detection
# ============================================================

def _check_outliers(
    series: pd.Series,
) -> list[dict[str, Any]]:

    if not pd.api.types.is_numeric_dtype(series):
        return []

    values = pd.to_numeric(
        series,
        errors="coerce",
    ).dropna()

    if len(values) < 10:
        return []

    q1 = float(
        values.quantile(0.25)
    )

    q3 = float(
        values.quantile(0.75)
    )

    iqr = q3 - q1

    # If all values are effectively identical,
    # IQR is not useful.
    if iqr == 0:
        return []

    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr

    outliers = values[
        (values < lower)
        | (values > upper)
    ]

    if outliers.empty:
        return []

    outlier_count = len(outliers)

    # Don't label an entire naturally skewed column as
    # "bad" just because IQR finds some outliers.
    outlier_ratio = (
        outlier_count / len(values)
    )

    if outlier_ratio > 0.10:
        return []

    examples = (
        outliers
        .drop_duplicates()
        .head(10)
        .tolist()
    )

    return [
        {
            "type": "statistical_outlier",
            "severity": "warning",
            "count": outlier_count,
            "examples": [
                _safe_value(value)
                for value in examples
            ],
            "message": (
                f"{outlier_count} values fall outside "
                "the statistical IQR range. "
                "Outliers are not automatically considered invalid."
            ),
        }
    ]


# ============================================================
# Duplicate Rows
# ============================================================

def _check_duplicate_rows(
    df: pd.DataFrame,
) -> int:

    return int(
        df.duplicated().sum()
    )


# ============================================================
# Column Profiling
# ============================================================

def _profile_column(
    series: pd.Series,
    column_name: str,
    total_rows: int,
) -> dict[str, Any]:

    datatype = str(
        series.dtype
    )

    missing_count, missing_issues = (
        _check_missing_values(series)
    )

    issues: list[dict[str, Any]] = []

    issues.extend(
        missing_issues
    )

    issues.extend(
        _check_column_name(
            column_name
        )
    )

    issues.extend(
        _check_empty_or_constant(
            series
        )
    )

    _, whitespace_issues = (
        _check_whitespace(series)
    )

    issues.extend(
        whitespace_issues
    )

    issues.extend(
        _check_categorical_consistency(
            series
        )
    )

    issues.extend(
        _check_email_column(
            series,
            column_name,
        )
    )

    issues.extend(
        _check_numeric_consistency(
            series
        )
    )

    issues.extend(
        _check_date_column(
            series,
            column_name,
        )
    )

    issues.extend(
        _check_outliers(
            series
        )
    )

    # --------------------------------------------------------
    # Determine status from severity
    # --------------------------------------------------------

    has_problem = any(
        issue.get("severity") == "problem"
        for issue in issues
    )

    has_warning = any(
        issue.get("severity") == "warning"
        for issue in issues
    )

    if has_problem:
        status = "problem"

    elif has_warning:
        status = "warning"

    else:
        status = "clean"

    # --------------------------------------------------------
    # Invalid count
    # --------------------------------------------------------

    invalid_count = sum(
        int(issue.get("count", 0))
        for issue in issues
        if issue.get("type")
        in {
            "invalid_email",
            "invalid_date",
            "mixed_numeric_values",
        }
    )

    # --------------------------------------------------------
    # Value examples
    # --------------------------------------------------------

    non_null = series.dropna()

    sample_values = [
        _safe_value(value)
        for value in non_null.head(5).tolist()
    ]

    unique_count = int(
        series.nunique(
            dropna=True
        )
    )

    return {
        "name": column_name,
        "datatype": datatype,
        "total_values": total_rows,
        "missing_count": missing_count,
        "unique_count": unique_count,
        "invalid_count": invalid_count,
        "sample_values": sample_values,
        "issues": issues,
        "status": status,
    }


# ============================================================
# Main Quality Scanner
# ============================================================

def scan_dataset(
    file_path: str,
    dataset_id: str | None = None,
    original_filename: str | None = None,
) -> dict:
    """
    Dynamically scan EVERY column in an uploaded dataset.

    The scanner is schema-agnostic.

    It does NOT assume that columns are named:
        Gender
        City
        Payment_Method
        Order_Date
        etc.

    Every column discovered at runtime is analyzed based
    on its actual datatype and values.

    This function is READ-ONLY.
    """

    # --------------------------------------------------------
    # Load
    # --------------------------------------------------------

    df = _load_dataset(
        file_path
    )

    total_rows = len(df)
    total_columns = len(df.columns)

    # --------------------------------------------------------
    # Dataset-level statistics
    # --------------------------------------------------------

    total_missing_values = int(
        df.isna().sum().sum()
    )

    duplicate_rows = (
        _check_duplicate_rows(df)
    )

    # --------------------------------------------------------
    # Analyze EVERY column
    # --------------------------------------------------------

    column_reports = []

    for column in df.columns:

        column_name = str(
            column
        )

        report = _profile_column(
            series=df[column],
            column_name=column_name,
            total_rows=total_rows,
        )

        column_reports.append(
            report
        )

    # --------------------------------------------------------
    # Summary counts
    # --------------------------------------------------------

    clean_columns = sum(
        report["status"] == "clean"
        for report in column_reports
    )

    warning_columns = sum(
        report["status"] == "warning"
        for report in column_reports
    )

    problem_columns = sum(
        report["status"] == "problem"
        for report in column_reports
    )

    # --------------------------------------------------------
    # Total invalid values
    # --------------------------------------------------------

    total_invalid_values = sum(
        report["invalid_count"]
        for report in column_reports
    )

    # --------------------------------------------------------
    # Quality Score
    #
    # This score is based on column health.
    # It is NOT an AI-generated score.
    # --------------------------------------------------------

    if total_columns == 0:

        quality_score = 0

    else:

        quality_score = round(
            (
                clean_columns
                / total_columns
            )
            * 100
        )

    # --------------------------------------------------------
    # Overall status
    # --------------------------------------------------------

    if total_rows == 0:
        overall_status = "needs_cleaning"

    elif total_columns == 0:
        overall_status = "needs_cleaning"

    elif problem_columns > 0:
        overall_status = "needs_cleaning"

    elif warning_columns > 0:
        overall_status = "needs_attention"

    else:
        overall_status = "clean"

    # --------------------------------------------------------
    # SQL compatibility
    # --------------------------------------------------------

    sql_issues = []

    for report in column_reports:

        for issue in report["issues"]:

            if issue["type"] in {
                "sql_column_name",
                "column_name_whitespace",
            }:

                sql_issues.append(
                    {
                        "column": report["name"],
                        "issue": issue["message"],
                    }
                )

    sql_ready = len(
        sql_issues
    ) == 0

    # --------------------------------------------------------
    # Dataset-level warnings
    # --------------------------------------------------------

    dataset_issues = []

    if duplicate_rows > 0:

        dataset_issues.append(
            {
                "type": "duplicate_rows",
                "severity": "warning",
                "count": duplicate_rows,
                "message": (
                    f"{duplicate_rows} duplicate rows detected."
                ),
            }
        )

    # --------------------------------------------------------
    # Final response
    # --------------------------------------------------------

    return {
        "dataset_id": dataset_id,

        "filename": original_filename,

        "status": overall_status,

        "quality_score": quality_score,

        "sql_ready": sql_ready,

        "summary": {
            "rows": total_rows,
            "columns": total_columns,
            "missing_values": total_missing_values,
            "duplicate_rows": duplicate_rows,
            "invalid_values": total_invalid_values,
            "clean_columns": clean_columns,
            "warning_columns": warning_columns,
            "problem_columns": problem_columns,
        },

        "dataset_issues": dataset_issues,

        "sql_issues": sql_issues,

        "columns": column_reports,
    }