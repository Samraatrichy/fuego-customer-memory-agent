from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq

import json
import os
import sqlite3

from backend.hindsight_service import (
    retain_memory,
    recall_memory,
    reflect_memory,
)

from backend.meeting_service import prepare_meeting
from backend.database import init_database


# =========================================
# APP
# =========================================

app = FastAPI(
    title="FUEGO Customer Memory Agent",
    description="Customer relationship memory powered by Hindsight",
)


# =========================================
# CORS
# =========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================
# CONFIGURATION
# =========================================

groq_client = Groq(
    api_key=os.environ["GROQ_API_KEY"]
)

GROQ_MODEL = "openai/gpt-oss-20b"

DATABASE_PATH = "data/fuego.db"


# =========================================
# DATABASE INITIALIZATION
# =========================================

init_database()


def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


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


class CustomerCreateRequest(BaseModel):
    name: str


class MeetingCreateRequest(BaseModel):
    date: str
    title: str
    participants: list[str]
    summary: str
    decisions: list[str] = []
    commitments: list[str] = []


class TicketCreateRequest(BaseModel):
    ticket_id: str
    date: str
    title: str
    priority: str
    status: str
    issue: str
    solution: str
    outcome: str


# =========================================
# CUSTOMER LOOKUP
# =========================================

def get_customer_by_name(customer: str):
    connection = get_connection()

    try:
        row = connection.execute(
            """
            SELECT *
            FROM customers
            WHERE LOWER(name) = LOWER(?)
            """,
            (customer,),
        ).fetchone()

        return row

    finally:
        connection.close()


# =========================================
# CUSTOMER DATA FROM SQLITE
# =========================================

def load_customer_records(customer: str):

    customer_row = get_customer_by_name(customer)

    if not customer_row:
        return [], []

    customer_id = customer_row["id"]

    connection = get_connection()

    try:

        meeting_rows = connection.execute(
            """
            SELECT *
            FROM meetings
            WHERE customer_id = ?
            ORDER BY date ASC
            """,
            (customer_id,),
        ).fetchall()

        ticket_rows = connection.execute(
            """
            SELECT *
            FROM support_tickets
            WHERE customer_id = ?
            ORDER BY date ASC
            """,
            (customer_id,),
        ).fetchall()

        meetings = []

        for row in meeting_rows:

            meetings.append({
                "customer": customer_row["name"],
                "date": row["date"],
                "title": row["title"],
                "participants": json.loads(
                    row["participants"]
                ),
                "summary": row["summary"],
                "decisions": json.loads(
                    row["decisions"]
                ),
                "commitments": json.loads(
                    row["commitments"]
                ),
            })

        tickets = []

        for row in ticket_rows:

            tickets.append({
                "customer": customer_row["name"],
                "ticket_id": row["ticket_id"],
                "date": row["date"],
                "title": row["title"],
                "priority": row["priority"],
                "status": row["status"],
                "issue": row["issue"],
                "solution": row["solution"],
                "outcome": row["outcome"],
            })

        return meetings, tickets

    finally:
        connection.close()


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
# HEALTH CHECK
# =========================================

@app.get("/health")
def health():

    try:

        connection = get_connection()

        connection.execute(
            "SELECT 1"
        ).fetchone()

        connection.close()

        return {
            "status": "healthy",
            "database": "connected",
            "hindsight": "configured",
            "groq": "configured",
        }

    except Exception as error:

        return {
            "status": "error",
            "message": str(error),
        }


# =========================================
# CUSTOMERS
# =========================================

@app.get("/customers")
def get_customers():

    connection = get_connection()

    try:

        rows = connection.execute(
            """
            SELECT
                id,
                name
            FROM customers
            ORDER BY name
            """
        ).fetchall()

        return {
            "customers": [
                {
                    "id": row["id"],
                    "name": row["name"],
                }
                for row in rows
            ]
        }

    finally:
        connection.close()


# =========================================
# ADD CUSTOMER
# =========================================

@app.post("/customers")
def create_customer(
    request: CustomerCreateRequest
):

    customer_name = request.name.strip()

    if not customer_name:
        raise HTTPException(
            status_code=400,
            detail="Customer name is required.",
        )

    existing = get_customer_by_name(
        customer_name
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Customer already exists.",
        )

    connection = get_connection()

    try:

        cursor = connection.execute(
            """
            INSERT INTO customers (name)
            VALUES (?)
            """,
            (customer_name,),
        )

        connection.commit()

        customer_id = cursor.lastrowid

    finally:
        connection.close()

    # Store the customer identity in Hindsight.
    retain_memory(
        f"""
Customer created in FUEGO:

Customer: {customer_name}

This customer is now part of the FUEGO customer relationship
memory system.
"""
    )

    return {
        "status": "created",
        "customer": {
            "id": customer_id,
            "name": customer_name,
        },
    }


# =========================================
# ADD MEETING
# =========================================

@app.post("/customers/{customer}/meetings")
def create_meeting(
    customer: str,
    request: MeetingCreateRequest,
):

    customer_row = get_customer_by_name(
        customer
    )

    if not customer_row:
        raise HTTPException(
            status_code=404,
            detail=f"Customer '{customer}' not found.",
        )

    customer_id = customer_row["id"]
    customer_name = customer_row["name"]

    connection = get_connection()

    try:

        cursor = connection.execute(
            """
            INSERT INTO meetings (
                customer_id,
                date,
                title,
                participants,
                summary,
                decisions,
                commitments
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                customer_id,
                request.date,
                request.title,
                json.dumps(
                    request.participants
                ),
                request.summary,
                json.dumps(
                    request.decisions
                ),
                json.dumps(
                    request.commitments
                ),
            ),
        )

        connection.commit()

        meeting_id = cursor.lastrowid

    finally:
        connection.close()

    # Send the new meeting to Hindsight.
    hindsight_content = f"""
Customer: {customer_name}

Meeting date: {request.date}

Meeting title: {request.title}

Participants:
{", ".join(request.participants)}

Summary:
{request.summary}

Decisions:
{json.dumps(request.decisions)}

Commitments:
{json.dumps(request.commitments)}
"""

    retain_memory(hindsight_content)

    return {
        "status": "created",
        "meeting_id": meeting_id,
        "customer": customer_name,
        "message": "Meeting stored in SQLite and Hindsight.",
    }


# =========================================
# ADD SUPPORT TICKET
# =========================================

@app.post("/customers/{customer}/tickets")
def create_ticket(
    customer: str,
    request: TicketCreateRequest,
):

    customer_row = get_customer_by_name(
        customer
    )

    if not customer_row:
        raise HTTPException(
            status_code=404,
            detail=f"Customer '{customer}' not found.",
        )

    customer_id = customer_row["id"]
    customer_name = customer_row["name"]

    connection = get_connection()

    try:

        existing_ticket = connection.execute(
            """
            SELECT id
            FROM support_tickets
            WHERE ticket_id = ?
            """,
            (request.ticket_id,),
        ).fetchone()

        if existing_ticket:

            raise HTTPException(
                status_code=409,
                detail="Ticket ID already exists.",
            )

        cursor = connection.execute(
            """
            INSERT INTO support_tickets (
                customer_id,
                ticket_id,
                date,
                title,
                priority,
                status,
                issue,
                solution,
                outcome
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                customer_id,
                request.ticket_id,
                request.date,
                request.title,
                request.priority,
                request.status,
                request.issue,
                request.solution,
                request.outcome,
            ),
        )

        connection.commit()

        ticket_id = cursor.lastrowid

    finally:
        connection.close()

    # Send the support issue to Hindsight.
    hindsight_content = f"""
Customer: {customer_name}

Support Ticket: {request.ticket_id}

Date: {request.date}

Title: {request.title}

Priority: {request.priority}

Status: {request.status}

Issue:
{request.issue}

Solution:
{request.solution}

Outcome:
{request.outcome}
"""

    retain_memory(hindsight_content)

    return {
        "status": "created",
        "ticket_id": ticket_id,
        "customer": customer_name,
        "message": "Support ticket stored in SQLite and Hindsight.",
    }


# =========================================
# HINDSIGHT RETAIN
# =========================================

@app.post("/memory/retain")
def retain(request: MemoryRequest):

    result = retain_memory(
        request.content
    )

    return {
        "status": "stored",
        "result": result,
    }


# =========================================
# HINDSIGHT RECALL
# =========================================

@app.post("/memory/recall")
def recall(request: QueryRequest):

    result = recall_memory(
        request.query
    )

    return {
        "result": result,
    }


# =========================================
# HINDSIGHT REFLECT
# =========================================

@app.post("/memory/reflect")
def reflect(request: QueryRequest):

    result = reflect_memory(
        request.query
    )

    return {
        "result": result,
    }


# =========================================
# MEETING PREPARATION
# =========================================

@app.post("/meeting/prepare")
def meeting_prepare(
    request: MeetingPrepRequest
):

    result = prepare_meeting(
        request.customer
    )

    return {
        "customer": request.customer,
        "meeting_brief": result,
    }


# =========================================
# ASK FUEGO
# =========================================

@app.post("/memory/ask")
def ask_fuego(
    request: AskRequest
):

    # -----------------------------------------
    # 1. RECALL LONG-TERM HINDSIGHT MEMORY
    # -----------------------------------------

    memory_query = (
        f"For customer {request.customer}, answer this question using "
        f"relevant historical customer interactions, meetings, support "
        f"issues, commitments, solutions, outcomes, and follow-ups: "
        f"{request.question}"
    )

    memories = recall_memory(
        memory_query
    )

    memory_items = []

    for result in memories.results[:10]:

        if getattr(result, "text", None):

            memory_items.append(
                result.text
            )

    memory_text = "\n\n".join(
        memory_items
    )

    # -----------------------------------------
    # 2. LOAD ORIGINAL SQLITE RECORDS
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
        indent=2,
    )

    # -----------------------------------------
    # 3. ASK GROQ
    # -----------------------------------------

    prompt = f"""
You are FUEGO, a customer relationship memory assistant.

CUSTOMER:
{request.customer}

USER QUESTION:
{request.question}


SOURCE 1 — HINDSIGHT LONG-TERM MEMORY

{memory_text}


SOURCE 2 — ORIGINAL CUSTOMER RECORDS

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

6. If a solution outcome says "Partially worked",
   "Partially resolved", or equivalent, describe it as partially
   successful.

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

Return only solutions whose original outcome indicates
successful results.

If the user asks:
"What solutions partially worked?"

Return only solutions whose original outcome indicates
partial success.

If the user asks:
"What issues are still open?"

Return only records whose current status is explicitly Open,
or issues explicitly described as pending/open.

If the user asks:
"What did we promise?"

Return documented commitments from meeting records.

Do not claim that commitments were completed unless the
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
            f"Finish reason: "
            f"{response.choices[0].finish_reason}"
        )

    return {
        "customer": request.customer,
        "question": request.question,
        "answer": answer,
        "memory_recalled": len(
            memory_items
        ),
    }


# =========================================
# COMMITMENT TRACKER
# =========================================

@app.get("/commitments/{customer}")
def get_commitments(
    customer: str
):

    meetings, tickets = load_customer_records(
        customer
    )

    commitments = []

    # -----------------------------------------
    # Meeting commitments
    # -----------------------------------------

    for meeting in meetings:

        for commitment in meeting.get(
            "commitments",
            []
        ):

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

        if ticket.get(
            "status",
            ""
        ).lower() == "open":

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
def get_solutions(
    customer: str
):

    meetings, tickets = load_customer_records(
        customer
    )

    solutions = []

    for ticket in tickets:

        outcome = ticket.get(
            "outcome",
            ""
        )

        outcome_lower = outcome.lower()

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


# =========================================
# CUSTOMER LEARNING
# =========================================

@app.get("/learning/{customer}")
def get_learning(
    customer: str
):

    learning_query = f"""
Analyze the long-term history of customer {customer}.

Identify the most useful lessons FUEGO should remember for
future interactions with this customer.

Focus specifically on:

1. Patterns in problems the customer has experienced.
2. Solutions that were successful.
3. Solutions that only partially worked.
4. Approaches that should not be repeated without caution.
5. Current unresolved customer needs.
6. Important preferences, concerns, or priorities explicitly
   supported by the customer's history.

Use only information supported by the customer's stored memories.

Do not invent facts, dates, owners, deadlines, preferences,
solutions, or outcomes.

Clearly distinguish between:

- What worked
- What partially worked
- What remains unresolved

Keep the response concise and useful for preparing for the
customer's next interaction.
"""

    reflection = reflect_memory(
        learning_query
    )

    learned_text = getattr(
        reflection,
        "text",
        None,
    )

    if not learned_text:

        learned_text = (
            "Hindsight did not return a learning summary "
            "for this customer."
        )

    return {
        "customer": customer,
        "learning": learned_text,
    }