import sys
import os
import unittest

# Ensure the backend directory is in the path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from app.services.sql_validator import validate_sql

class TestSQLValidator(unittest.TestCase):
    def setUp(self):
        # Mock dataset schema matching health survey columns
        self.columns = [
            {"name": "Age", "datatype": "int64"},
            {"name": "Work_Type", "datatype": "object", "unique_values": ["Production", "Housewife", "Self-employed"]},
            {"name": "Health_Problems", "datatype": "object", "unique_values": ["No", "Yes", "Yes(BP)"]},
            {"name": "Name", "datatype": "object"}, # No unique_values since it is high-cardinality (>50 unique values)
        ]

    # TEST 1 — Valid COUNT
    def test_valid_count(self):
        sql = "SELECT COUNT(*) FROM dataset;"
        res = validate_sql(sql, self.columns)
        self.assertTrue(res["valid"])
        self.assertEqual(len(res["errors"]), 0)

    # TEST 2 — Valid AVG
    def test_valid_avg(self):
        sql = "SELECT AVG(Age) FROM dataset;"
        res = validate_sql(sql, self.columns)
        self.assertTrue(res["valid"])
        self.assertEqual(len(res["errors"]), 0)

    # TEST 3 — Valid GROUP BY
    def test_valid_groupby(self):
        sql = "SELECT Work_Type, COUNT(*) FROM dataset GROUP BY Work_Type;"
        res = validate_sql(sql, self.columns)
        self.assertTrue(res["valid"])
        self.assertEqual(len(res["errors"]), 0)

    # TEST 4 — Invalid Column
    def test_invalid_column(self):
        sql = "SELECT AVG(Salary) FROM dataset;"
        res = validate_sql(sql, self.columns)
        self.assertFalse(res["valid"])
        self.assertTrue(any("column" in err.lower() for err in res["errors"]))

    # TEST 5 — Invalid Table
    def test_invalid_table(self):
        sql = "SELECT * FROM users;"
        res = validate_sql(sql, self.columns)
        self.assertFalse(res["valid"])
        self.assertTrue(any("table" in err.lower() for err in res["errors"]))

    # TEST 6 — INSERT
    def test_insert(self):
        sql = "INSERT INTO dataset VALUES (45, 'Production');"
        res = validate_sql(sql, self.columns)
        self.assertFalse(res["valid"])
        self.assertTrue(any("disallowed" in err.lower() for err in res["errors"]))

    # TEST 7 — DELETE
    def test_delete(self):
        sql = "DELETE FROM dataset;"
        res = validate_sql(sql, self.columns)
        self.assertFalse(res["valid"])
        self.assertTrue(any("disallowed" in err.lower() for err in res["errors"]))

    # TEST 8 — DROP
    def test_drop(self):
        sql = "DROP TABLE dataset;"
        res = validate_sql(sql, self.columns)
        self.assertFalse(res["valid"])
        self.assertTrue(any("disallowed" in err.lower() for err in res["errors"]))

    # TEST 9 — Multiple Statements
    def test_multiple_statements(self):
        sql = "SELECT * FROM dataset; DROP TABLE dataset;"
        res = validate_sql(sql, self.columns)
        self.assertFalse(res["valid"])
        self.assertTrue(any("multiple" in err.lower() for err in res["errors"]))

    # TEST 10 — Valid LIMIT
    def test_valid_limit(self):
        question = "Show the first 10 respondents."
        sql = "SELECT * FROM dataset LIMIT 10;"
        res = validate_sql(sql, self.columns, question=question)
        self.assertTrue(res["valid"])
        self.assertEqual(len(res["errors"]), 0)

    # TEST 11 — Suspicious LIMIT
    def test_suspicious_limit(self):
        question = "What is the average age?"
        sql = "SELECT AVG(Age) FROM dataset LIMIT 10;"
        res = validate_sql(sql, self.columns, question=question)
        # It triggers a warning but may still be valid depending on policy (we set valid=True, warning generated)
        self.assertTrue(res["valid"])
        self.assertTrue(any("LIMIT clause" in warn for warn in res["warnings"]))

    # TEST 12 — NULL
    def test_null(self):
        sql = "SELECT COUNT(*) FROM dataset WHERE Health_Problems IS NOT NULL;"
        res = validate_sql(sql, self.columns)
        self.assertTrue(res["valid"])
        self.assertEqual(len(res["errors"]), 0)

    # TEST 13 — Known categorical value
    def test_known_categorical_value(self):
        sql = "SELECT COUNT(*) FROM dataset WHERE Health_Problems = 'No';"
        res = validate_sql(sql, self.columns)
        self.assertTrue(res["valid"])
        self.assertEqual(len(res["errors"]), 0)
        self.assertEqual(len(res["warnings"]), 0)

    # TEST 14 — Unknown categorical value
    def test_unknown_categorical_value(self):
        sql = "SELECT COUNT(*) FROM dataset WHERE Health_Problems = 'UnknownCategory';"
        res = validate_sql(sql, self.columns)
        self.assertTrue(res["valid"])  # It compiles fine, but should issue a warning
        self.assertTrue(any("observed unique values" in warn for warn in res["warnings"]))

    # TEST 15 — High-cardinality column
    def test_high_cardinality_column(self):
        # A specific search on Name must NOT produce a warning even though unique_values is unavailable
        sql = "SELECT COUNT(*) FROM dataset WHERE Name = 'Alice';"
        res = validate_sql(sql, self.columns)
        self.assertTrue(res["valid"])
        self.assertEqual(len(res["warnings"]), 0)

    # TEST 16 — INSUFFICIENT_SCHEMA
    def test_insufficient_schema(self):
        sql = "SELECT 'INSUFFICIENT_SCHEMA';"
        res = validate_sql(sql, self.columns)
        self.assertTrue(res["valid"])
        self.assertTrue(res.get("is_insufficient_schema"))
        self.assertEqual(len(res["errors"]), 0)

if __name__ == "__main__":
    unittest.main()
