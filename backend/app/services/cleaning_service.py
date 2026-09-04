from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from app.services.quality_service import scan_dataset


# ============================================================
# Configuration
# ============================================================

#These are common textual representations of missing data.
# They are intentionally conservative.
MISSING_PLACEHOLDERS = {
    "",
    "na",
    "n/a",
    "n.a",
    "none",
    "null",
    "nan",
    "missing",
    "not available",
    "not_applicable",
    "not applicable",
    "nil",
}


DATE_COLUMN_HINTS = {
    "date",
    "datetime",
    "timestamp",
    "created",
    "updated",
    "dob",
    "birth",
    "joining",
    "joined",
    "signup",
    "registered",
}


EMAIL_COLUMN_HINTS = {
    "email",
    "e_mail",
    "email_address",
    "mail",
}


EMAIL_PATTERN = re.compile(
    r"^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@"
    r"[A-Za-z0-9]"
    r"(?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?"
    r"(?:\.[A-Za-z0-9]"
    r"(?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$"
)


CURRENCY_SYMBOLS = "$€£₹¥"

CURRENCY_CODES = {
    "usd",
    "eur",
    "gbp",
    "inr",
    "jpy",
    "cad",
    "aud",
}


# ============================================================
# General Helpers
# ============================================================

def _is_missing_placeholder(value: Any) -> bool:
    """
    Determine whether a value is an explicitly recognized
    missing-value placeholder.

    This function is deliberately conservative.
    """

    if value is None:
        return True

    try:
        if pd.isna(value):
            return True
    except (TypeError, ValueError):
        pass

    if not isinstance(value, str):
        return False

    normalized = value.strip().casefold()

    return normalized in MISSING_PLACEHOLDERS


def _safe_value(value: Any) -> Any:
    """
    Convert NumPy/Pandas values into JSON-safe values.
    """

    if value is None:
        return None

    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass

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


def _normalize_column_name(
    column_name: str,
) -> str:
    """
    Normalize a column name only for detection purposes.

    The actual column name in the dataset is NOT modified.
    """

    return re.sub(
        r"[_\-\s]+",
        " ",
        str(column_name).strip().casefold(),
    )


def _column_has_date_hint(
    column_name: str,
) -> bool:
    """
    Detect whether a column name appears date-related.

    This is a generic heuristic, not a domain-specific rule.
    """

    normalized = _normalize_column_name(
        column_name
    )

    tokens = set(
        normalized.split()
    )

    return bool(
        tokens.intersection(
            DATE_COLUMN_HINTS
        )
    )


def _column_has_email_hint(
    column_name: str,
) -> bool:
    """
    Detect email-like columns from their names.

    This is only a hint. Actual values are still inspected.
    """

    normalized = _normalize_column_name(
        column_name
    )

    return any(
        hint in normalized
        for hint in EMAIL_COLUMN_HINTS
    )


# ============================================================
# Dataset Loading
# ============================================================

def _load_dataset(
    file_path: str,
) -> pd.DataFrame:
    """
    Load a CSV or Excel dataset.

    The original file is never modified.
    """

    if not file_path:
        raise ValueError(
            "Dataset file path is missing."
        )

    if not os.path.exists(file_path):
        raise FileNotFoundError(
            f"Dataset file not found: {file_path}"
        )

    extension = (
        Path(file_path)
        .suffix
        .casefold()
    )

    if extension == ".csv":

        try:
            return pd.read_csv(
                file_path
            )

        except UnicodeDecodeError:

            return pd.read_csv(
                file_path,
                encoding="latin1",
            )

        except Exception as exc:

            raise ValueError(
                f"Unable to read CSV file: {exc}"
            ) from exc

    if extension in {
        ".xlsx",
        ".xls",
    }:

        try:
            return pd.read_excel(
                file_path
            )

        except Exception as exc:

            raise ValueError(
                f"Unable to read Excel file: {exc}"
            ) from exc

    raise ValueError(
        f"Unsupported cleaning format: {extension}"
    )


# ============================================================
# Save Cleaned Dataset
# ============================================================

def _save_cleaned_dataset(
    df: pd.DataFrame,
    original_path: str,
    output_directory: str | None = None,
) -> str:
    """
    Save the cleaned dataset as a NEW file.

    The original dataset is never overwritten.
    """

    original = Path(
        original_path
    )

    if output_directory:

        output_dir = Path(
            output_directory
        )

    else:

        output_dir = (
            original.parent
            / "cleaned"
        )

    output_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    unique_id = os.urandom(4).hex()

    output_stem = (
        f"{original.stem}"
        f"_cleaned_{unique_id}"
    )

    extension = (
        original.suffix.casefold()
    )

    if extension == ".csv":

        output_path = (
            output_dir
            / f"{output_stem}.csv"
        )

        df.to_csv(
            output_path,
            index=False,
        )

    elif extension in {
        ".xlsx",
        ".xls",
    }:

        output_path = (
            output_dir
            / f"{output_stem}.xlsx"
        )

        df.to_excel(
            output_path,
            index=False,
        )

    else:

        raise ValueError(
            f"Unsupported output format: {extension}"
        )

    return str(
        output_path
    )


# ============================================================
# 1. Missing Value Normalization
# ============================================================

def _normalize_missing_values(
    df: pd.DataFrame,
) -> tuple[int, dict[str, int]]:
    """
    Convert recognized textual missing placeholders into NaN.

    Example:

        "N/A"   -> NaN
        "none"  -> NaN
        "  "    -> NaN
        "NULL"  -> NaN

    Legitimate values are not guessed or changed.
    """

    total_changes = 0

    changes_by_column: dict[str, int] = {}

    for column in df.columns:

        series = df[column]

        # Missing-value placeholders are primarily relevant
        # to textual/object columns.
        if not (
            pd.api.types.is_object_dtype(
                series
            )
            or pd.api.types.is_string_dtype(
                series
            )
        ):
            continue

        changed = 0

        for index, value in series.items():

            if not isinstance(
                value,
                str,
            ):
                continue

            if not _is_missing_placeholder(
                value
            ):
                continue

            if pd.isna(value):
                continue

            df.at[
                index,
                column,
            ] = np.nan

            changed += 1

        if changed > 0:

            column_name = str(
                column
            )

            changes_by_column[
                column_name
            ] = changed

            total_changes += changed

    return (
        total_changes,
        changes_by_column,
    )


# ============================================================
# 2. Whitespace Normalization
# ============================================================

def _trim_text_values(
    df: pd.DataFrame,
) -> tuple[int, dict[str, int]]:
    """
    Remove leading/trailing whitespace from textual values.

    Example:

        " UPI " -> "UPI"
        " Delhi" -> "Delhi"
    """

    total_changes = 0

    changes_by_column: dict[str, int] = {}

    for column in df.columns:

        series = df[column]

        if not (
            pd.api.types.is_object_dtype(
                series
            )
            or pd.api.types.is_string_dtype(
                series
            )
        ):
            continue

        changed = 0

        for index, value in series.items():

            if not isinstance(
                value,
                str,
            ):
                continue

            # Missing placeholders are handled separately.
            if _is_missing_placeholder(
                value
            ):
                continue

            cleaned = value.strip()

            if cleaned == value:
                continue

            df.at[
                index,
                column,
            ] = cleaned

            changed += 1

        if changed > 0:

            column_name = str(
                column
            )

            changes_by_column[
                column_name
            ] = changed

            total_changes += changed

    return (
        total_changes,
        changes_by_column,
    )


# ============================================================
# 3. Categorical Normalization
# ============================================================

def _is_reasonable_categorical_column(
    series: pd.Series,
) -> bool:
    """
    Determine whether a text column is reasonably
    categorical.

    High-cardinality text is treated as free text and
    is NOT automatically case-normalized.
    """

    non_null = series.dropna()

    if non_null.empty:
        return False

    unique_count = int(
        non_null.astype(str).nunique()
    )

    if unique_count <= 1:
        return False

    # Avoid modifying arbitrary free-text columns.
    if unique_count > 100:
        return False

    return True


def _normalize_categorical_values(
    df: pd.DataFrame,
) -> tuple[int, dict[str, int]]:
    """
    Normalize obvious categorical variants.

    Example:

        UPI
        upi
        Upi
        UPI

    become the most common existing representation.

    The cleaner does NOT invent a new category.
    """

    total_changes = 0

    changes_by_column: dict[str, int] = {}

    for column in df.columns:

        series = df[column]

        if not (
            pd.api.types.is_object_dtype(
                series
            )
            or pd.api.types.is_string_dtype(
                series
            )
        ):
            continue

        if not _is_reasonable_categorical_column(
            series
        ):
            continue

        non_null = series.dropna()

        groups: dict[
            str,
            list[str]
        ] = {}

        for value in non_null.astype(str):

            normalized = (
                value
                .strip()
                .casefold()
            )

            groups.setdefault(
                normalized,
                [],
            ).append(value)

        changed = 0

        for normalized, variants in groups.items():

            unique_variants = list(
                dict.fromkeys(
                    variants
                )
            )

            # Nothing inconsistent.
            if len(unique_variants) <= 1:
                continue

            counts = (
                pd.Series(
                    variants
                )
                .value_counts()
            )

            canonical = str(
                counts.index[0]
            )

            for index, value in series.items():

                if not isinstance(
                    value,
                    str,
                ):
                    continue

                if (
                    value.strip().casefold()
                    != normalized
                ):
                    continue

                if value == canonical:
                    continue

                df.at[
                    index,
                    column,
                ] = canonical

                changed += 1

        if changed > 0:

            column_name = str(
                column
            )

            changes_by_column[
                column_name
            ] = changed

            total_changes += changed

    return (
        total_changes,
        changes_by_column,
    )


# ============================================================
# 4. Numeric / Currency Detection
# ============================================================

def _parse_numeric_value(
    value: Any,
) -> float | None:
    """
    Safely parse a numeric/currency representation.

    Examples:

        "1,000"   -> 1000
        "$1,000"  -> 1000
        "₹1000"   -> 1000

    Invalid values return None rather than being guessed.
    """

    if value is None:
        return None

    if isinstance(
        value,
        (
            int,
            float,
            np.integer,
            np.floating,
        ),
    ):

        try:

            if pd.isna(value):
                return None

        except (
            TypeError,
            ValueError,
        ):
            return None

        return float(value)

    if not isinstance(
        value,
        str,
    ):
        return None

    text = value.strip()

    if not text:
        return None

    # Remove currency symbols.
    for symbol in CURRENCY_SYMBOLS:

        text = text.replace(
            symbol,
            "",
        )

    # Remove recognized currency codes.
    text = re.sub(
        r"\b(?:USD|EUR|GBP|INR|JPY|CAD|AUD)\b",
        "",
        text,
        flags=re.IGNORECASE,
    )

    text = text.strip()

    # Remove thousands separators.
    text = text.replace(
        ",",
        "",
    )

    # Do not accept arbitrary text.
    if not re.fullmatch(
        r"[-+]?(?:\d+(?:\.\d+)?|\.\d+)",
        text,
    ):
        return None

    try:

        return float(text)

    except ValueError:

        return None


def _numeric_likeness(
    series: pd.Series,
) -> float:

    non_null = series.dropna()

    if non_null.empty:
        return 0.0

    valid_count = 0

    for value in non_null:

        if (
            _parse_numeric_value(
                value
            )
            is not None
        ):
            valid_count += 1

    return (
        valid_count
        / len(non_null)
    )


def _normalize_numeric_columns(
    df: pd.DataFrame,
) -> tuple[int, dict[str, int]]:
    """
    Normalize columns that are overwhelmingly numeric.

    A 90% threshold is used so that arbitrary text columns
    are not accidentally converted.

    Values that cannot be safely converted are left untouched.
    """

    total_changes = 0

    changes_by_column: dict[str, int] = {}

    for column in df.columns:

        series = df[column]

        if pd.api.types.is_numeric_dtype(
            series
        ):
            continue

        non_null = series.dropna()

        if non_null.empty:
            continue

        likeness = _numeric_likeness(
            series
        )

        if likeness < 0.90:
            continue

        changed = 0

        for index, value in series.items():

            if pd.isna(value):
                continue

            parsed = _parse_numeric_value(
                value
            )

            # Never guess.
            if parsed is None:
                continue

            if float(parsed).is_integer():

                cleaned_value: int | float = int(
                    parsed
                )

            else:

                cleaned_value = parsed

            if str(value) != str(
                cleaned_value
            ):

                df.at[
                    index,
                    column,
                ] = cleaned_value

                changed += 1

        if changed > 0:

            column_name = str(
                column
            )

            changes_by_column[
                column_name
            ] = changed

            total_changes += changed

    return (
        total_changes,
        changes_by_column,
    )


# ============================================================
# 5. Date Detection
# ============================================================

def _date_likeness(
    series: pd.Series,
    column_name: str,
) -> float:
    """
    Determine whether a column appears to contain dates.

    format="mixed" is intentional because the quality/cleaning
    system must be able to inspect mixed date representations.
    """

    non_null = series.dropna()

    if non_null.empty:
        return 0.0

    # Numeric columns are not assumed to be dates unless
    # their name provides a strong date hint.
    if (
        pd.api.types.is_numeric_dtype(
            series
        )
        and not _column_has_date_hint(
            column_name
        )
    ):
        return 0.0

    parsed = pd.to_datetime(
        non_null,
        errors="coerce",
        format="mixed",
    )

    return float(
        parsed.notna().mean()
    )


def _normalize_date_columns(
    df: pd.DataFrame,
) -> tuple[
    int,
    dict[str, int],
    list[dict[str, Any]],
]:
    """
    Standardize strongly date-like columns to YYYY-MM-DD.

    Ambiguous/unsafe columns are skipped rather than guessed.
    """

    total_changes = 0

    changes_by_column: dict[str, int] = {}

    skipped: list[
        dict[str, Any]
    ] = []

    for column in df.columns:

        column_name = str(
            column
        )

        series = df[column]

        likeness = _date_likeness(
            series,
            column_name,
        )

        if likeness < 0.90:
            continue

        non_null = series.dropna()

        if non_null.empty:
            continue

        parsed = pd.to_datetime(
            non_null,
            errors="coerce",
            format="mixed",
        )

        invalid_count = int(
            parsed.isna().sum()
        )

        if invalid_count > 0:

            skipped.append({
                "column": column_name,
                "reason": (
                    "Some values could not be "
                    "safely parsed as dates."
                ),
                "invalid_count": invalid_count,
            })

            continue

        changed = 0

        for index, parsed_value in parsed.items():

            if pd.isna(
                parsed_value
            ):
                continue

            cleaned_value = (
                parsed_value.strftime(
                    "%Y-%m-%d"
                )
            )

            original_value = df.at[
                index,
                column,
            ]

            if (
                str(original_value)
                != cleaned_value
            ):

                df.at[
                    index,
                    column,
                ] = cleaned_value

                changed += 1

        if changed > 0:

            changes_by_column[
                column_name
            ] = changed

            total_changes += changed

    return (
        total_changes,
        changes_by_column,
        skipped,
    )


# ============================================================
# 6. Email Whitespace Cleanup
# ============================================================

def _clean_email_values(
    df: pd.DataFrame,
) -> tuple[int, dict[str, int]]:
    """
    Trim whitespace from columns that appear to contain emails.

    Invalid email values are NOT invented or repaired.
    """

    total_changes = 0

    changes_by_column: dict[str, int] = {}

    for column in df.columns:

        column_name = str(
            column
        )

        if not _column_has_email_hint(
            column_name
        ):
            continue

        series = df[column]

        if not (
            pd.api.types.is_object_dtype(
                series
            )
            or pd.api.types.is_string_dtype(
                series
            )
        ):
            continue

        changed = 0

        for index, value in series.items():

            if not isinstance(
                value,
                str,
            ):
                continue

            cleaned = value.strip()

            if cleaned == value:
                continue

            df.at[
                index,
                column,
            ] = cleaned

            changed += 1

        if changed > 0:

            changes_by_column[
                column_name
            ] = changed

            total_changes += changed

    return (
        total_changes,
        changes_by_column,
    )


# ============================================================
# 7. Exact Duplicate Removal
# ============================================================

def _remove_exact_duplicates(
    df: pd.DataFrame,
) -> tuple[pd.DataFrame, int]:
    """
    Remove only exact duplicate rows.

    Similar-but-not-identical rows are never removed.
    """

    duplicate_count = int(
        df.duplicated().sum()
    )

    if duplicate_count == 0:
        return (
            df,
            0,
        )

    cleaned_df = (
        df
        .drop_duplicates(
            keep="first"
        )
        .reset_index(
            drop=True
        )
    )

    return (
        cleaned_df,
        duplicate_count,
    )


# ============================================================
# 8. Cleaning Summary
# ============================================================

def _build_change_summary(
    original_df: pd.DataFrame,
    cleaned_df: pd.DataFrame,
) -> dict[str, Any]:
    """
    Build a high-level summary without changing data.
    """

    original_rows = len(
        original_df
    )

    cleaned_rows = len(
        cleaned_df
    )

    original_columns = len(
        original_df.columns
    )

    cleaned_columns = len(
        cleaned_df.columns
    )

    return {
        "original_rows": original_rows,
        "cleaned_rows": cleaned_rows,
        "rows_removed": (
            original_rows
            - cleaned_rows
        ),
        "original_columns": (
            original_columns
        ),
        "cleaned_columns": (
            cleaned_columns
        ),
    }


# ============================================================
# Main Cleaning Function
# ============================================================

def clean_dataset(
    file_path: str,
    dataset_id: str | None = None,
    original_filename: str | None = None,
    output_directory: str | None = None,
) -> dict[str, Any]:
    """
    Generic, deterministic dataset cleaning pipeline.

    Supported:
        CSV
        XLSX
        XLS

    The cleaner:

        1. Loads the original dataset.
        2. Normalizes recognized missing placeholders.
        3. Trims text whitespace.
        4. Normalizes obvious categorical variants.
        5. Normalizes strongly numeric columns.
        6. Standardizes strongly date-like columns.
        7. Trims email values.
        8. Removes exact duplicate rows.
        9. Saves a NEW cleaned dataset.
       10. Re-scans the cleaned dataset.
       11. Returns the cleaning + verification report.

    The original dataset is NEVER overwritten.
    """

    # --------------------------------------------------------
    # Load original dataset
    # --------------------------------------------------------

    df = _load_dataset(
        file_path
    )

    original_df = df.copy(
        deep=True
    )

    # --------------------------------------------------------
    # 1. Missing values
    # --------------------------------------------------------

    (
        missing_count,
        missing_by_column,
    ) = _normalize_missing_values(
        df
    )

    # --------------------------------------------------------
    # 2. Whitespace
    # --------------------------------------------------------

    (
        whitespace_count,
        whitespace_by_column,
    ) = _trim_text_values(
        df
    )

    # --------------------------------------------------------
    # 3. Categorical consistency
    # --------------------------------------------------------

    (
        categorical_count,
        categorical_by_column,
    ) = _normalize_categorical_values(
        df
    )

    # --------------------------------------------------------
    # 4. Numeric / currency
    # --------------------------------------------------------

    (
        numeric_count,
        numeric_by_column,
    ) = _normalize_numeric_columns(
        df
    )

    # --------------------------------------------------------
    # 5. Dates
    # --------------------------------------------------------

    (
        date_count,
        date_by_column,
        skipped_dates,
    ) = _normalize_date_columns(
        df
    )

    # --------------------------------------------------------
    # 6. Emails
    # --------------------------------------------------------

    (
        email_count,
        email_by_column,
    ) = _clean_email_values(
        df
    )

    # --------------------------------------------------------
    # 7. Exact duplicates
    # --------------------------------------------------------

    (
        df,
        duplicate_count,
    ) = _remove_exact_duplicates(
        df
    )

    # --------------------------------------------------------
    # Save NEW dataset
    # --------------------------------------------------------

    cleaned_path = _save_cleaned_dataset(
        df=df,
        original_path=file_path,
        output_directory=output_directory,
    )

    # --------------------------------------------------------
    # Verification
    #
    # IMPORTANT:
    # We scan the actual cleaned file, not the in-memory
    # DataFrame, so verification tests the file that will
    # actually be used downstream.
    # --------------------------------------------------------

    verification = scan_dataset(
        file_path=cleaned_path,
        dataset_id=dataset_id,
        original_filename=Path(
            cleaned_path
        ).name,
    )

    # --------------------------------------------------------
    # Summary
    # --------------------------------------------------------

    summary = _build_change_summary(
        original_df=original_df,
        cleaned_df=df,
    )

    # --------------------------------------------------------
    # Final response
    # --------------------------------------------------------

    return {
        "dataset_id": dataset_id,

        "original_filename": (
            original_filename
            or Path(
                file_path
            ).name
        ),

        "cleaned_filename": Path(
            cleaned_path
        ).name,

        "original_file_path": file_path,

        "cleaned_file_path": cleaned_path,

        "status": "cleaned",

        "summary": summary,

        "changes": {
            "missing_values_normalized": (
                missing_count
            ),

            "whitespace_trimmed": (
                whitespace_count
            ),

            "categorical_values_normalized": (
                categorical_count
            ),

            "numeric_values_normalized": (
                numeric_count
            ),

            "dates_normalized": (
                date_count
            ),

            "email_whitespace_cleaned": (
                email_count
            ),

            "duplicate_rows_removed": (
                duplicate_count
            ),
        },

        "changes_by_column": {
            "missing_values": (
                missing_by_column
            ),

            "whitespace": (
                whitespace_by_column
            ),

            "categorical": (
                categorical_by_column
            ),

            "numeric": (
                numeric_by_column
            ),

            "dates": (
                date_by_column
            ),

            "email": (
                email_by_column
            ),
        },

        "skipped": {
            "ambiguous_or_unsafe_dates": (
                skipped_dates
            ),

            "outliers": (
                "Statistical outliers are not "
                "automatically modified because an "
                "outlier is not necessarily invalid."
            ),

            "invalid_emails": (
                "Invalid email values are not "
                "invented or automatically corrected. "
                "They remain available for review."
            ),

            "constant_columns": (
                "Constant columns are preserved because "
                "a constant column is not automatically "
                "a data-quality error."
            ),

            "unknown_semantics": (
                "The cleaner does not infer domain-specific "
                "meaning or invent replacement values."
            ),
        },

        "verification": verification,
    }
