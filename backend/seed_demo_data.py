import json
from backend.database import get_connection
from backend.hindsight_service import retain_memory


CUSTOMERS = {
    "Microsoft (Demo)": {
        "meetings": [
            {
                "date": "2026-09-10",
                "title": "Power BI Performance Review",
                "participants": ["Alex - Microsoft", "Sam - FUEGO"],
                "summary": "Customer reported slow dashboard loading during peak usage.",
                "decisions": ["Optimize dashboard queries and review data model performance."],
                "commitments": ["FUEGO team will investigate dashboard performance before the next meeting."]
            },
            {
                "date": "2026-09-20",
                "title": "Performance Follow-up",
                "participants": ["Alex - Microsoft", "Sam - FUEGO"],
                "summary": "Dashboard performance improved after query optimization.",
                "decisions": ["Continue monitoring dashboard response times."],
                "commitments": ["FUEGO team will monitor performance for another two weeks."]
            }
        ],
        "tickets": [
            {
                "ticket_id": "MS-101",
                "date": "2026-09-11",
                "title": "Dashboard Loading Delay",
                "priority": "High",
                "status": "Resolved",
                "issue": "Power BI dashboard was taking too long to load.",
                "solution": "Optimized slow DAX queries and removed unnecessary visual calculations.",
                "outcome": "Worked. Dashboard loading time improved significantly."
            },
            {
                "ticket_id": "MS-102",
                "date": "2026-09-18",
                "title": "Data Refresh Delay",
                "priority": "Medium",
                "status": "Resolved",
                "issue": "Scheduled data refresh occasionally exceeded the expected duration.",
                "solution": "Adjusted refresh scheduling and optimized the data pipeline.",
                "outcome": "Partially worked. Refresh time improved but occasional delays remained."
            }
        ]
    },

    "Amazon (Demo)": {
        "meetings": [
            {
                "date": "2026-09-05",
                "title": "Data Integration Discussion",
                "participants": ["Priya - Amazon", "Sam - FUEGO"],
                "summary": "Customer discussed delays in synchronizing operational data.",
                "decisions": ["Review the existing batch synchronization process."],
                "commitments": ["FUEGO team will test an optimized synchronization approach."]
            },
            {
                "date": "2026-09-22",
                "title": "Integration Follow-up",
                "participants": ["Priya - Amazon", "Sam - FUEGO"],
                "summary": "Data synchronization became more stable after pipeline changes.",
                "decisions": ["Keep the optimized synchronization process."],
                "commitments": ["FUEGO team will continue monitoring synchronization failures."]
            }
        ],
        "tickets": [
            {
                "ticket_id": "AMZ-201",
                "date": "2026-09-06",
                "title": "Data Synchronization Delay",
                "priority": "High",
                "status": "Resolved",
                "issue": "Operational data was arriving late in the reporting system.",
                "solution": "Moved synchronization to scheduled batch processing.",
                "outcome": "Worked. Synchronization became stable."
            },
            {
                "ticket_id": "AMZ-202",
                "date": "2026-09-15",
                "title": "Pipeline Failure",
                "priority": "High",
                "status": "Resolved",
                "issue": "Data pipeline occasionally failed during peak processing.",
                "solution": "Increased retry attempts and added additional logging.",
                "outcome": "Partially worked. Failures decreased but did not disappear completely."
            }
        ]
    },

    "Google (Demo)": {
        "meetings": [
            {
                "date": "2026-09-03",
                "title": "Analytics Dashboard Review",
                "participants": ["Rahul - Google", "Sam - FUEGO"],
                "summary": "Customer requested faster analytics dashboards and better monitoring.",
                "decisions": ["Investigate dashboard query performance."],
                "commitments": ["FUEGO team will provide a performance improvement plan."]
            },
            {
                "date": "2026-09-19",
                "title": "Analytics Improvement Review",
                "participants": ["Rahul - Google", "Sam - FUEGO"],
                "summary": "Dashboard performance improved after data model changes.",
                "decisions": ["Continue monitoring dashboard performance."],
                "commitments": ["FUEGO team will review performance metrics next month."]
            }
        ],
        "tickets": [
            {
                "ticket_id": "GGL-301",
                "date": "2026-09-04",
                "title": "Slow Analytics Dashboard",
                "priority": "Medium",
                "status": "Resolved",
                "issue": "Analytics dashboard was slow when filtering large datasets.",
                "solution": "Created aggregated tables and simplified the semantic model.",
                "outcome": "Worked. Dashboard response time improved."
            },
            {
                "ticket_id": "GGL-302",
                "date": "2026-09-14",
                "title": "Monitoring Gap",
                "priority": "Low",
                "status": "Open",
                "issue": "There was insufficient monitoring for dashboard refresh failures.",
                "solution": "Added additional monitoring and alerting.",
                "outcome": "Not confirmed. Improvement has not yet been validated."
            }
        ]
    },

    "IBM (Demo)": {
        "meetings": [
            {
                "date": "2026-09-07",
                "title": "SAP Integration Review",
                "participants": ["Daniel - IBM", "Sam - FUEGO"],
                "summary": "Customer reported intermittent SAP integration failures.",
                "decisions": ["Review integration logs and retry configuration."],
                "commitments": ["FUEGO team will investigate the integration failures."]
            },
            {
                "date": "2026-09-21",
                "title": "SAP Integration Follow-up",
                "participants": ["Daniel - IBM", "Sam - FUEGO"],
                "summary": "Integration reliability improved after retry configuration changes.",
                "decisions": ["Keep the updated retry configuration."],
                "commitments": ["FUEGO team will monitor integration reliability."]
            }
        ],
        "tickets": [
            {
                "ticket_id": "IBM-401",
                "date": "2026-09-08",
                "title": "SAP Integration Failure",
                "priority": "Critical",
                "status": "Resolved",
                "issue": "SAP integration failed intermittently.",
                "solution": "Increased retry attempts and improved error handling.",
                "outcome": "Worked. Integration failures were significantly reduced."
            },
            {
                "ticket_id": "IBM-402",
                "date": "2026-09-16",
                "title": "Connection Timeout",
                "priority": "High",
                "status": "Resolved",
                "issue": "Some SAP requests were timing out.",
                "solution": "Increased connection timeout and added connection monitoring.",
                "outcome": "Partially worked. Timeouts reduced but still occurred occasionally."
            }
        ]
    },

    "Accenture (Demo)": {
        "meetings": [
            {
                "date": "2026-09-09",
                "title": "Reporting Platform Review",
                "participants": ["Meera - Accenture", "Sam - FUEGO"],
                "summary": "Customer requested improvements to reporting reliability.",
                "decisions": ["Review the reporting refresh pipeline."],
                "commitments": ["FUEGO team will investigate refresh failures."]
            },
            {
                "date": "2026-09-23",
                "title": "Reporting Follow-up",
                "participants": ["Meera - Accenture", "Sam - FUEGO"],
                "summary": "Refresh reliability improved after pipeline optimization.",
                "decisions": ["Continue monitoring the reporting pipeline."],
                "commitments": ["FUEGO team will review refresh failure metrics."]
            }
        ],
        "tickets": [
            {
                "ticket_id": "ACC-501",
                "date": "2026-09-10",
                "title": "Report Refresh Failure",
                "priority": "High",
                "status": "Resolved",
                "issue": "Reports occasionally failed during scheduled refresh.",
                "solution": "Optimized the refresh pipeline and added retry handling.",
                "outcome": "Worked. Refresh failures were eliminated during the monitoring period."
            },
            {
                "ticket_id": "ACC-502",
                "date": "2026-09-17",
                "title": "Report Timeout",
                "priority": "Medium",
                "status": "Open",
                "issue": "Some reports still experience timeout errors.",
                "solution": "Added query monitoring and logging.",
                "outcome": "Not confirmed. The team is waiting for additional monitoring data."
            }
        ]
    }
}


def add_customer(connection, name):
    existing = connection.execute(
        "SELECT id FROM customers WHERE name = ?",
        (name,)
    ).fetchone()

    if existing:
        return existing["id"]

    cursor = connection.execute(
        "INSERT INTO customers (name) VALUES (?)",
        (name,)
    )
    connection.commit()
    return cursor.lastrowid


def add_meeting(connection, customer_id, customer_name, meeting):
    existing = connection.execute(
        """
        SELECT id FROM meetings
        WHERE customer_id = ? AND date = ? AND title = ?
        """,
        (customer_id, meeting["date"], meeting["title"])
    ).fetchone()

    if existing:
        return

    connection.execute(
        """
        INSERT INTO meetings
        (
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
            meeting["date"],
            meeting["title"],
            json.dumps(meeting["participants"]),
            meeting["summary"],
            json.dumps(meeting["decisions"]),
            json.dumps(meeting["commitments"])
        )
    )

    connection.commit()

    memory = f"""
Customer: {customer_name}
Meeting date: {meeting['date']}
Meeting title: {meeting['title']}
Participants: {', '.join(meeting['participants'])}
Summary: {meeting['summary']}
Decisions: {'; '.join(meeting['decisions'])}
Commitments: {'; '.join(meeting['commitments'])}
"""

    retain_memory(memory)


def add_ticket(connection, customer_id, customer_name, ticket):
    existing = connection.execute(
        """
        SELECT id FROM support_tickets
        WHERE customer_id = ? AND ticket_id = ?
        """,
        (customer_id, ticket["ticket_id"])
    ).fetchone()

    if existing:
        return

    connection.execute(
        """
        INSERT INTO support_tickets
        (
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
            ticket["ticket_id"],
            ticket["date"],
            ticket["title"],
            ticket["priority"],
            ticket["status"],
            ticket["issue"],
            ticket["solution"],
            ticket["outcome"]
        )
    )

    connection.commit()

    memory = f"""
Customer: {customer_name}
Support ticket: {ticket['ticket_id']}
Date: {ticket['date']}
Issue: {ticket['issue']}
Solution attempted: {ticket['solution']}
Outcome: {ticket['outcome']}
Status: {ticket['status']}
"""

    retain_memory(memory)


def main():
    connection = get_connection()

    total_customers = 0
    total_meetings = 0
    total_tickets = 0

    for customer_name, data in CUSTOMERS.items():
        customer_id = add_customer(connection, customer_name)
        total_customers += 1

        for meeting in data["meetings"]:
            add_meeting(connection, customer_id, customer_name, meeting)
            total_meetings += 1

        for ticket in data["tickets"]:
            add_ticket(connection, customer_id, customer_name, ticket)
            total_tickets += 1

    connection.close()

    print("====================================")
    print("FUEGO DEMO DATA LOADED")
    print("====================================")
    print(f"Customers processed: {total_customers}")
    print(f"Meetings processed:  {total_meetings}")
    print(f"Tickets processed:   {total_tickets}")
    print("SQLite + Hindsight updated successfully.")
    print("====================================")


if __name__ == "__main__":
    main()
