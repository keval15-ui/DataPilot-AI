import json
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
MODEL_NAME = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

client = Groq(api_key=api_key)

def generate_analytics_and_chart(question: str, sql: str, result: list[dict]) -> dict:
    """
    Generate an explanation and chart configuration for the query result.
    """
    if not result:
        return {
            "explanation": "No data returned for this query.",
            "chart_type": "none",
            "x_key": "",
            "y_keys": []
        }

    # Limit result payload to avoid context limits
    total_rows = len(result)
    is_truncated = total_rows > 15
    preview_result = result[:15]
    columns = list(result[0].keys())

    prompt = f"""
You are an expert data analyst. You have just run an SQL query based on a user's question.

User Question: "{question}"
SQL Query: "{sql}"

Actual SQL Query Results:
Total Rows in SQL Result: {total_rows}
Is Result Truncated for Display: {"Yes (showing first 15 rows)" if is_truncated else "No (showing all rows)"}
Sample Query Results (JSON):
{json.dumps(preview_result, indent=2)}

Available Columns in Result: {columns}

Instructions for Explanation:
1. Ground the explanation strictly in the original user question, the generated SQL, and the actual SQL execution result.
2. Explain ONLY what the executed SQL actually measured. Do NOT reinterpret the meaning of a SQL result or add facts not supported by the query.
3. Do NOT infer that a non-NULL value represents a positive condition/category. If the SQL counts non-NULL values, describe them as "records with a recorded/non-null value" or similar, not as records having the underlying condition (unless a positive category is explicitly filtered).
4. If the SQL explicitly filters a positive category (e.g. column = 'Yes'), you may describe that positive category.
5. If the SQL filters to exclude a negative category (e.g. column <> 'No'), describe the result as excluding that category (e.g. "value other than 'No'").
6. Treat the SQL query and its results as the absolute source of truth. Never calculate, extrapolate, or invent numerical values, percentages, trends, or relationships.
7. If the SQL result is truncated (Is Result Truncated for Display is "Yes"), do NOT claim that the displayed preview rows represent the entire dataset, and do not make claims about rows that are not present in the result unless derived from dataset-wide SQL aggregations.
8. If the SQL result is empty, explain that no matching records were found.
9. If the SQL returns NULL, explain it as unknown/missing rather than interpreting it as zero or negative.
10. Keep the explanation concise, factual, and strictly limited to 1-3 sentences.

Instructions for Chart Recommendation:
1. Recommend a visual representation based ONLY on the actual SQL result and its columns.
2. Choose one of: 'bar', 'line', 'pie', 'area', or 'none'.
3. Do NOT recommend a chart using columns that are not present in the returned result.
4. If the result contains only one row/value or is a single scalar aggregate (like a single COUNT or AVG), recommend 'none' because a chart is not meaningful.
5. Identify the X-axis key (typically a categorical, date, or label column from the results) and the Y-axis keys (numeric columns representing values to plot from the results).

Return ONLY a valid JSON object matching this schema. Do not output any other text or markdown block formatting.

Schema:
{{
  "explanation": "concise, strictly grounded explanation of query results",
  "chart_type": "bar" | "line" | "pie" | "area" | "none",
  "x_key": "name_of_column_for_x_axis_from_result",
  "y_keys": ["name_of_column_for_y_axis_from_result"]
}}
"""

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            temperature=0,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content.strip()
        data = json.loads(content)
        return {
            "explanation": data.get("explanation") or "Query executed successfully.",
            "chart_type": (data.get("chart_type") or "none").lower(),
            "x_key": data.get("x_key") or "",
            "y_keys": data.get("y_keys") or []
        }
    except Exception as e:
        print(f"Error in generating analytics: {e}")
        # Return fallback values
        x_key = columns[0] if columns else ""
        y_keys = [col for col in columns if col != x_key][:2]
        return {
            "explanation": "Query executed successfully with results.",
            "chart_type": "bar" if len(result) > 1 else "none",
            "x_key": x_key,
            "y_keys": y_keys
        }
