import os
from hindsight_client import Hindsight

HINDSIGHT_URL = "https://api.hindsight.vectorize.io"
BANK_ID = "fuego-customer-memory"

client = Hindsight(
    base_url=HINDSIGHT_URL,
    api_key=os.environ["HINDSIGHT_API_KEY"],
)


def retain_memory(content: str):
    return client.retain(
        bank_id=BANK_ID,
        content=content,
    )


def recall_memory(query: str):
    return client.recall(
        bank_id=BANK_ID,
        query=query,
    )


def reflect_memory(query: str):
    return client.reflect(
        bank_id=BANK_ID,
        query=query,
    )
