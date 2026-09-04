from fastapi import APIRouter, HTTPException

from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
)

from app.services.dataset_service import get_dataset
from app.llm.groq_client import generate_sql, regenerate_sql
from app.services.query_service import execute_query
from app.services.analytics_service import generate_analytics_and_chart
from app.services.sql_validator import validate_sql
from app.services.rag_service import retrieve_schema_context


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

    # 1. Fetch relevant schema context using RAG
    schema_context = retrieve_schema_context(
        question=request.question,
        dataset_id=request.dataset_id
    )

    # 2. Generate SQL using Groq
    sql = generate_sql(
        question=request.question,
        columns=dataset["column_info"],
        schema_context=schema_context
    )

    # Validate SQL query
    validation = validate_sql(
        sql=sql,
        columns=dataset["column_info"],
        question=request.question,
        file_path=dataset["path"],
    )

    # Controlled retry loop: one regeneration attempt if invalid (excluding INSUFFICIENT_SCHEMA)
    if not validation["valid"] and not validation.get("is_insufficient_schema"):
        print(f"\n[VALIDATION FAILED] Attempting controlled regeneration due to errors: {validation['errors']}")
        try:
            sql = regenerate_sql(
                question=request.question,
                columns=dataset["column_info"],
                previous_sql=sql,
                errors=validation["errors"],
                schema_context=schema_context
            )
            # Re-validate
            validation = validate_sql(
                sql=sql,
                columns=dataset["column_info"],
                question=request.question,
                file_path=dataset["path"],
            )
        except Exception as retry_err:
            print(f"[RETRY ERROR] Failed to regenerate query: {retry_err}")
            # Keep previous validation errors if retry fails
            pass

    # Handle insufficient schema response
    if validation.get("is_insufficient_schema"):
        print("[INSUFFICIENT SCHEMA] Returning controlled empty response")
        from app.schemas.chat import ChartConfig
        return ChatResponse(
            sql="SELECT 'INSUFFICIENT_SCHEMA';",
            result=[],
            explanation="This question cannot be answered from the available dataset schema.",
            chart_config=ChartConfig(chart_type="none", x_key="", y_keys=[]),
        )

    # Handle fatal validation failure
    if not validation["valid"]:
        print(f"\n[VALIDATION FAILED] Query could not be validated: {validation['errors']}\n")
        raise HTTPException(
            status_code=400,
            detail=f"SQL Validation Failed: {', '.join(validation['errors'])}",
        )

    print("\n==============================")
    print("[START] NEW CHAT REQUEST (VALIDATED)")
    print("==============================")
    print("Question:")
    print(request.question)

    print("\nDataset ID:")
    print(request.dataset_id)

    print("\nDataset Path:")
    print(dataset["path"])

    print("\nValidated SQL:")
    print(sql)

    print("==============================\n")

    try:

        # Execute SQL
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