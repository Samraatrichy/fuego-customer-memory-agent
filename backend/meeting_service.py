import json

from backend.database import get_connection
from backend.hindsight_service import recall_memory
from backend.llm_service import generate_meeting_brief


# =========================================
# LOAD CUSTOMER HISTORY FROM SQLITE
# =========================================

def load_customer_history(customer: str):
    connection = get_connection()

    try:
        customer_row = connection.execute(
            """
            SELECT id, name
            FROM customers
            WHERE LOWER(name) = LOWER(?)
            """,
            (customer,),
        ).fetchone()

        if not customer_row:
            return [], []

        customer_id = customer_row["id"]
        customer_name = customer_row["name"]

        # -----------------------------------------
        # LOAD MEETINGS
        # -----------------------------------------

        meeting_rows = connection.execute(
            """
            SELECT
                id,
                date,
                title,
                participants,
                summary,
                decisions,
                commitments
            FROM meetings
            WHERE customer_id = ?
            ORDER BY date ASC
            """,
            (customer_id,),
        ).fetchall()

        meetings = []

        for row in meeting_rows:
            meetings.append(
                {
                    "customer": customer_name,
                    "date": row["date"],
                    "title": row["title"],
                    "participants": json.loads(
                        row["participants"] or "[]"
                    ),
                    "summary": row["summary"] or "",
                    "decisions": json.loads(
                        row["decisions"] or "[]"
                    ),
                    "commitments": json.loads(
                        row["commitments"] or "[]"
                    ),
                }
            )

        # -----------------------------------------
        # LOAD SUPPORT TICKETS
        # -----------------------------------------

        ticket_rows = connection.execute(
            """
            SELECT
                id,
                ticket_id,
                date,
                title,
                priority,
                status,
                issue,
                solution,
                outcome
            FROM support_tickets
            WHERE customer_id = ?
            ORDER BY date ASC
            """,
            (customer_id,),
        ).fetchall()

        tickets = []

        for row in ticket_rows:
            tickets.append(
                {
                    "customer": customer_name,
                    "ticket_id": row["ticket_id"],
                    "date": row["date"],
                    "title": row["title"],
                    "priority": row["priority"],
                    "status": row["status"],
                    "issue": row["issue"],
                    "solution": row["solution"],
                    "outcome": row["outcome"],
                }
            )

        return meetings, tickets

    finally:
        connection.close()


# =========================================
# PREPARE MEETING
# =========================================

def prepare_meeting(customer: str):

    # -----------------------------------------
    # 1. RECALL LONG-TERM HINDSIGHT MEMORY
    # -----------------------------------------

    query = (
        f"Prepare me for my next meeting with {customer}. "
        f"Recall recent meetings, support issues, open problems, "
        f"commitments, successful solutions, failed solutions, "
        f"customer concerns, and important follow-ups."
    )

    memories = recall_memory(query)

    memory_items = []

    for result in memories.results[:10]:
        if getattr(result, "text", None):
            memory_items.append(result.text)

    memory_text = "\n\n".join(memory_items)

    # -----------------------------------------
    # 2. LOAD CURRENT RECORDS FROM SQLITE
    # -----------------------------------------

    meetings, tickets = load_customer_history(customer)

    source_data = {
        "meetings": meetings,
        "support_tickets": tickets,
    }

    source_text = json.dumps(
        source_data,
        indent=2,
    )

    # -----------------------------------------
    # 3. GENERATE MEETING BRIEF
    # -----------------------------------------

    return generate_meeting_brief(
        customer=customer,
        memory_text=memory_text,
        source_text=source_text,
    )