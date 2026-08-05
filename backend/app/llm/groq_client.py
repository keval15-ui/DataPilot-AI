import os

from groq import Groq
from dotenv import load_dotenv

from app.llm.prompt_builder import build_sql_prompt

# ==========================================
# Load Environment Variables
# ==========================================

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError("GROQ_API_KEY not found in .env file.")

MODEL_NAME = os.getenv(
    "GROQ_MODEL",
    "llama-3.3-70b-versatile"
)

# ==========================================
# Initialize Groq Client
# ==========================================

client = Groq(api_key=api_key)


# ==========================================
# General Chat (Testing Only)
# ==========================================

def generate_text(prompt: str) -> str:
    """
    Generate a general text response from Groq.
    Used only for testing the connection.
    """

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        temperature=0,
    )

    return response.choices[0].message.content.strip()


# ==========================================
# SQL Generator
# ==========================================

def generate_sql(
    question: str,
    columns: list[dict],
) -> str:
    """
    Generate SQL from a natural language question.
    """

    prompt = build_sql_prompt(
        question=question,
        columns=columns,
    )

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        temperature=0,
    )

    return response.choices[0].message.content.strip()


# ==========================================
# Local Testing
# ==========================================

if __name__ == "__main__":

    print("===== Groq Chat Test =====\n")

    print(
        generate_text(
            "Hello! Tell me who you are in one sentence."
        )
    )

    print("\n===============================\n")

    sample_columns = [
        {
            "name": "Region",
            "datatype": "TEXT",
        },
        {
            "name": "Sales",
            "datatype": "FLOAT",
        },
        {
            "name": "Profit",
            "datatype": "FLOAT",
        },
    ]

    print("===== SQL Generation Test =====\n")

    print(
        generate_sql(
            "Which region has the highest total sales?",
            sample_columns,
        )
    )