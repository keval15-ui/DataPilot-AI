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
    preview_result = result[:15]
    columns = list(result[0].keys())

    prompt = f"""
You are an expert data analyst. You have just run an SQL query based on a user's question.

User Question: "{question}"
SQL Query: "{sql}"
Sample Query Results (JSON, showing up to 15 rows):
{json.dumps(preview_result, indent=2)}

Available Columns: {columns}

Instructions:
1. Analyze the query results and write a concise, human-friendly explanation or summary (1-3 sentences) highlighting key insights, trends, or notable values.
2. Recommend the best visual representation of this data for a chart. Choose one of: 'bar', 'line', 'pie', 'area', or 'none'. If the data is a single scalar or not suitable for charts, return 'none'.
3. Identify the X-axis key (typically a categorical, date, or label column) and the Y-axis keys (numeric columns representing values to plot).

Return ONLY a valid JSON object matching this schema. Do not output any other text or wrapping.

Schema:
{{
  "explanation": "concise explanation of query results",
  "chart_type": "bar" | "line" | "pie" | "area" | "none",
  "x_key": "name_of_column_for_x_axis",
  "y_keys": ["name_of_column_for_y_axis"]
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
