import os
from groq import Groq

client = Groq(api_key=os.environ["GROQ_API_KEY"])

MODEL = "openai/gpt-oss-20b"


def generate_meeting_brief(
    customer: str,
    memory_text: str,
    source_text: str,
):
    prompt = f"""
Create a concise meeting brief for {customer}.

You have two sources:

SOURCE 1 — HINDSIGHT MEMORY
This shows what the long-term memory system recalled.

{memory_text}

SOURCE 2 — ORIGINAL CUSTOMER RECORDS
This is the factual source of truth.

{source_text}

STRICT RULES:
- Use the ORIGINAL CUSTOMER RECORDS as the source of truth.
- Hindsight memory is context only.
- Never invent information.
- Never invent dates, deadlines, owners, meetings, requirements, or actions.
- Never change a ticket ID, status, priority, date, issue, solution, or outcome.
- Never claim a commitment was completed unless the original records explicitly say so.
- If something is not in the original records, do not include it as a fact.
- Do not turn a request into a commitment.
- Do not create future dates.
- Keep the response under 600 words.

Return ONLY these sections:

1. Customer Snapshot
2. Recent Meetings
3. Open Support Issues
4. Previous Commitments
5. Solutions That Worked
6. Solutions That Failed or Partially Worked
7. Recommended Talking Points
8. Follow-ups to Remember

For Recommended Talking Points and Follow-ups, only use issues,
requests, decisions, or commitments explicitly present in the original records.
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a factual customer relationship assistant. "
                    "Never fabricate customer information."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        temperature=0.0,
        max_completion_tokens=2000,
    )

    content = response.choices[0].message.content

    if not content:
        raise RuntimeError(
            f"Groq returned empty content. Finish reason: "
            f"{response.choices[0].finish_reason}"
        )

    return content
