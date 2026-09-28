import json
from hindsight_service import client, BANK_ID


def load_meetings():
    with open("data/meetings.json", "r") as f:
        meetings = json.load(f)

    for meeting in meetings:
        content = (
            f"Customer: {meeting['customer']}. "
            f"Meeting date: {meeting['date']}. "
            f"Meeting title: {meeting['title']}. "
            f"Participants: {', '.join(meeting['participants'])}. "
            f"Summary: {meeting['summary']} "
            f"Decisions: {'; '.join(meeting['decisions'])}. "
            f"Commitments: {'; '.join(meeting['commitments'])}."
        )

        client.retain(
            bank_id=BANK_ID,
            content=content,
            context="customer_meeting",
            timestamp=f"{meeting['date']}T00:00:00Z",
        )

        print(f"Stored meeting: {meeting['title']}")


def load_tickets():
    with open("data/tickets.json", "r") as f:
        tickets = json.load(f)

    for ticket in tickets:
        content = (
            f"Customer: {ticket['customer']}. "
            f"Support ticket: {ticket['ticket_id']}. "
            f"Date: {ticket['date']}. "
            f"Title: {ticket['title']}. "
            f"Priority: {ticket['priority']}. "
            f"Status: {ticket['status']}. "
            f"Issue: {ticket['issue']} "
            f"Solution attempted: {ticket['solution']} "
            f"Outcome: {ticket['outcome']}."
        )

        client.retain(
            bank_id=BANK_ID,
            content=content,
            context="customer_support_ticket",
            timestamp=f"{ticket['date']}T00:00:00Z",
        )

        print(f"Stored ticket: {ticket['ticket_id']}")


if __name__ == "__main__":
    print("Loading FUEGO customer history into Hindsight...\n")

    load_meetings()
    load_tickets()

    print("\nFinished loading customer history.")

    client.close()
