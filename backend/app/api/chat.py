from fastapi import APIRouter, HTTPException

from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
)

from app.services.dataset_service import get_dataset

from app.llm.groq_client import generate_sql

from app.services.query_service import execute_query

from app.services.analytics_service import generate_analytics_and_chart


router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
)


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):

    # Retrieve uploaded dataset
    dataset = get_dataset(request.dataset_id)

    if dataset is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found.",
        )

    # Generate SQL using Groq
    sql = generate_sql(
        question=request.question,
        columns=dataset["column_info"],
    )

    print("\n==============================")
    print("[START] NEW CHAT REQUEST")
    print("==============================")
    print("Question:")
    print(request.question)

    print("\nDataset ID:")
    print(request.dataset_id)

    print("\nDataset Path:")
    print(dataset["path"])

    print("\nGenerated SQL:")
    print(sql)

    print("==============================\n")

    try:

        # Execute SQL using DuckDB
        result = execute_query(
            file_path=dataset["path"],
            sql=sql,
        )

        print("[SUCCESS] SQL Executed Successfully")
        print("Returned Rows:", len(result))
        print()

    except Exception as e:

        print("\n[ERROR] SQL EXECUTION FAILED")
        print("--------------------------------")
        print(str(e))
        print("--------------------------------\n")

        raise HTTPException(
            status_code=400,
            detail=f"SQL Execution Failed: {str(e)}",
        )

    # Generate explanation and chart config
    analytics = generate_analytics_and_chart(
        question=request.question,
        sql=sql,
        result=result,
    )

    return ChatResponse(
        sql=sql,
        result=result,
        explanation=analytics["explanation"],
        chart_config=analytics,
    )