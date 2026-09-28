import json

from backend.hindsight_service import recall_memory
from backend.llm_service import generate_meeting_brief


def load_customer_history(customer: str):
    with open("data/meetings.json", "r") as f:
        meetings = json.load(f)

    with open("data/tickets.json", "r") as f:
        tickets = json.load(f)

    customer_meetings = [
        m for m in meetings
        if m["customer"].lower() == customer.lower()
    ]

    customer_tickets = [
        t for t in tickets
        if t["customer"].lower() == customer.lower()
    ]

    return customer_meetings, customer_tickets


def prepare_meeting(customer: str):
    query = (
        f"Prepare me for my next meeting with {customer}. "
        f"Recall recent meetings, support issues, open problems, "
        f"commitments, successful solutions, failed solutions, "
        f"customer concerns, and important follow-ups."
    )

    # Hindsight provides the agent's long-term memory.
    memories = recall_memory(query)

    memory_items = []

    for result in memories.results[:10]:
        if getattr(result, "text", None):
            memory_items.append(result.text)

    memory_text = "\n\n".join(memory_items)

    # Original records are the factual source of truth.
    meetings, tickets = load_customer_history(customer)

    source_data = {
        "meetings": meetings,
        "support_tickets": tickets,
    }

    source_text = json.dumps(source_data, indent=2)

    return generate_meeting_brief(
        customer=customer,
        memory_text=memory_text,
        source_text=source_text,
    )
