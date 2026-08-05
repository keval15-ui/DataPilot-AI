"""
Prompt Builder

This module is responsible for creating prompts
that are sent to the LLM.

It contains no API calls.
"""


def build_sql_prompt(
    question: str,
    columns: list[dict],
) -> str:
    """
    Build a prompt for SQL generation.
    """

    schema = "\n".join(
        f"- {column['name']} ({column['datatype']})"
        for column in columns
    )

    prompt = f"""
You are an expert SQL assistant.

Dataset Schema:

{schema}

Table Name:
dataset

User Question:
{question}

Instructions:

1. Return ONLY a valid SQL query.
2. Do NOT explain anything.
3. Do NOT use Markdown.
4. Do NOT wrap SQL inside ```sql```.
5. Use only the provided columns.
6. Assume the table name is exactly 'dataset'.
7. Never invent column names.
8. If the question cannot be answered using the available schema,
   return:

SELECT 'INSUFFICIENT_SCHEMA';

"""

    return prompt.strip()