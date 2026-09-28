from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
import json
import os

from backend.hindsight_service import (
    retain_memory,
    recall_memory,
    reflect_memory,
)

from backend.meeting_service import prepare_meeting


app = FastAPI(
    title="FUEGO Customer Memory Agent",
    description="Customer relationship memory powered by Hindsight",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


groq_client = Groq(
    api_key=os.environ["GROQ_API_KEY"]
)

GROQ_MODEL = "openai/gpt-oss-20b"


# =========================================
# REQUEST MODELS
# =========================================

class MemoryRequest(BaseModel):
    content: str


class QueryRequest(BaseModel):
    query: str


class MeetingPrepRequest(BaseModel):
    customer: str


class AskRequest(BaseModel):
    customer: str
    question: str


# =========================================
# CUSTOMER DATA
# =========================================

def load_customer_records(customer: str):
    with open("data/meetings.json", "r") as f:
        meetings = json.load(f)

    with open("data/tickets.json", "r") as f:
        tickets = json.load(f)

    customer_meetings = [
        meeting
        for meeting in meetings
        if meeting["customer"].lower() == customer.lower()
    ]

    customer_tickets = [
        ticket
        for ticket in tickets
        if ticket["customer"].lower() == customer.lower()
    ]

    return customer_meetings, customer_tickets


# =========================================
# ROOT
# =========================================

@app.get("/")
def root():
    return {
        "name": "FUEGO Customer Memory Agent",
        "status": "running",
    }


# =========================================
# HINDSIGHT RETAIN
# =========================================

@app.post("/memory/retain")
def retain(request: MemoryRequest):
    result = retain_memory(request.content)

    return {
        "status": "stored",
        "result": result,
    }


# =========================================
# HINDSIGHT RECALL
# =========================================

@app.post("/memory/recall")
def recall(request: QueryRequest):
    result = recall_memory(request.query)

    return {
        "result": result,
    }


# =========================================
# HINDSIGHT REFLECT
# =========================================

@app.post("/memory/reflect")
def reflect(request: QueryRequest):
    result = reflect_memory(request.query)

    return {
        "result": result,
    }


# =========================================
# MEETING PREPARATION
# =========================================

@app.post("/meeting/prepare")
def meeting_prepare(request: MeetingPrepRequest):
    result = prepare_meeting(request.customer)

    return {
        "customer": request.customer,
        "meeting_brief": result,
    }


# =========================================
# ASK FUEGO
# =========================================

@app.post("/memory/ask")
def ask_fuego(request: AskRequest):

    # -----------------------------------------
    # 1. RECALL LONG-TERM HINDSIGHT MEMORY
    # -----------------------------------------

    memory_query = (
        f"For customer {request.customer}, answer this question using "
        f"relevant historical customer interactions, meetings, support "
        f"issues, commitments, solutions, outcomes, and follow-ups: "
        f"{request.question}"
    )

    memories = recall_memory(memory_query)

    memory_items = []

    for result in memories.results[:10]:
        if getattr(result, "text", None):
            memory_items.append(result.text)

    memory_text = "\n\n".join(memory_items)


    # -----------------------------------------
    # 2. LOAD ORIGINAL CUSTOMER RECORDS
    # -----------------------------------------

    meetings, tickets = load_customer_records(
        request.customer
    )

    source_data = {
        "meetings": meetings,
        "support_tickets": tickets,
    }

    source_text = json.dumps(
        source_data,
        indent=2
    )


    # -----------------------------------------
    # 3. ASK GROQ USING BOTH SOURCES
    # -----------------------------------------

    prompt = f"""
You are FUEGO, a customer relationship memory assistant.

CUSTOMER:
{request.customer}

USER QUESTION:
{request.question}


SOURCE 1 — HINDSIGHT LONG-TERM MEMORY

Hindsight has recalled the following historical context:

{memory_text}


SOURCE 2 — ORIGINAL CUSTOMER RECORDS

These are the authoritative records for this customer:

{source_text}


IMPORTANT SOURCE-OF-TRUTH RULE:

The ORIGINAL CUSTOMER RECORDS are the factual source of truth.

Hindsight memory provides historical context and helps retrieve
relevant information, but it must NOT override the original records.


STRICT RULES:

1. Never invent customer information.

2. Never invent dates, ticket IDs, commitments, owners,
   statuses, solutions, or outcomes.

3. If a support ticket has status "Resolved", do NOT describe it
   as an open issue.

4. If a support ticket has status "Open", it is an open issue.

5. If a solution outcome says "Worked", it can be described as
   successful.

6. If a solution outcome says "Partially worked", "Partially resolved",
   or equivalent, describe it as partially successful.
   Do NOT place it under solutions that fully worked.

7. Do not call a solution successful merely because Hindsight
   memory contains positive language about it.

8. Do not combine separate events into one event unless the
   original records explicitly connect them.

9. Do not turn a customer request into a completed action.

10. Do not claim a commitment was completed unless the original
    records explicitly say it was completed.

11. If the original records do not contain enough information,
    clearly say that the available customer records do not contain
    enough information.

12. Answer ONLY the user's question.

13. Keep the answer concise and useful.

14. Mention ticket IDs and dates when they help answer the question.

15. Do not create future dates.

16. Do not use information about other customers.


QUESTION-SPECIFIC GUIDANCE:

If the user asks:
"What solutions worked?"
Return only solutions whose original outcome indicates that
they worked successfully.

If the user asks:
"What solutions partially worked?"
Return only solutions whose original outcome indicates partial
success.

If the user asks:
"What issues are still open?"
Return only records whose current status is explicitly Open,
or issues explicitly described as pending/open in the original
records.

If the user asks:
"What did we promise?"
Return documented commitments from the original meeting records.
Do not claim that those commitments were completed unless the
records explicitly confirm completion.


Return only the final answer.
"""


    # -----------------------------------------
    # 4. GENERATE ANSWER
    # -----------------------------------------

    response = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are FUEGO, a factual customer relationship "
                    "memory assistant. Hindsight provides long-term "
                    "memory retrieval, while original customer records "
                    "are the factual source of truth."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        temperature=0.0,
        max_completion_tokens=1000,
    )


    answer = response.choices[0].message.content


    if not answer:
        raise RuntimeError(
            f"Groq returned empty content. "
            f"Finish reason: {response.choices[0].finish_reason}"
        )


    return {
        "customer": request.customer,
        "question": request.question,
        "answer": answer,
        "memory_recalled": len(memory_items),
    }


# =========================================
# COMMITMENT TRACKER
# =========================================

@app.get("/commitments/{customer}")
def get_commitments(customer: str):

    meetings, tickets = load_customer_records(customer)

    commitments = []

    # -----------------------------------------
    # Meeting commitments
    # -----------------------------------------

    for meeting in meetings:
        for commitment in meeting.get("commitments", []):
            commitments.append({
                "date": meeting.get("date"),
                "commitment": commitment,
                "status": "Needs confirmation",
                "source": "Meeting",
            })

    # -----------------------------------------
    # Open support requests
    # -----------------------------------------

    for ticket in tickets:
        if ticket.get("status", "").lower() == "open":
            commitments.append({
                "date": ticket.get("date"),
                "commitment": ticket.get("title"),
                "status": "Open",
                "source": ticket.get("ticket_id"),
            })

    return {
        "customer": customer,
        "commitments": commitments,
    }


# =========================================
# SOLUTION MEMORY
# =========================================

@app.get("/solutions/{customer}")
def get_solutions(customer: str):

    meetings, tickets = load_customer_records(customer)

    solutions = []

    # -----------------------------------------
    # Extract documented support solutions
    # -----------------------------------------

    for ticket in tickets:

        outcome = ticket.get("outcome", "")
        outcome_lower = outcome.lower()

        # Determine result strictly from the recorded outcome
        if "partially worked" in outcome_lower:
            result = "Partially worked"

        elif "worked" in outcome_lower:
            result = "Worked"

        else:
            result = "Not confirmed"

        solutions.append({
            "ticket_id": ticket.get("ticket_id"),
            "date": ticket.get("date"),
            "issue": ticket.get("issue"),
            "solution": ticket.get("solution"),
            "outcome": outcome,
            "result": result,
        })

    return {
        "customer": customer,
        "solutions": solutions,
    }