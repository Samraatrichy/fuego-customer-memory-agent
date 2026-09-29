# FUEGO — AI Customer Memory Agent

AI Customer Relationship Memory Agent powered by Hindsight.

## 🚀 Live Demo

https://fuego-customer-memory-agent-1.onrender.com/

## 📌 Project Overview

FUEGO is an AI Customer Relationship Memory Agent designed to help teams maintain long-term customer context across meetings, support issues, commitments, and previous solutions.

Instead of starting every customer interaction with limited context, FUEGO uses **Hindsight** as a persistent memory layer to retain and recall relevant customer history and prepare teams for their next interaction.

## ✨ Key Features

- **Customer Memory** — Remembers important customer interactions and history.
- **Meeting Preparation** — Prepares a context-rich brief before the next customer meeting.
- **Commitment Tracker** — Tracks promises, follow-ups, and commitments that still need confirmation.
- **Solution Memory** — Remembers previous solutions and identifies solutions that worked, partially worked, or were not confirmed.
- **Ask FUEGO** — Ask questions about a customer's previous interactions and retrieve relevant context.
- **Multi-Customer Support** — Maintains separate customer histories for multiple customers.
- **Hindsight Memory** — Uses persistent memory to recall relevant information across interactions.

## 🧠 How It Works

1. Customer meetings and support interactions are stored.
2. Important interaction details are retained in Hindsight.
3. When the customer returns, FUEGO recalls relevant historical context.
4. The system combines customer records with retrieved memory.
5. Groq generates a meeting brief and relevant talking points.
6. Previous commitments and solutions are surfaced so teams can avoid repeating mistakes.

## 🔄 Before vs After

### Before FUEGO

- Customer context is scattered across previous interactions.
- Teams may forget commitments and follow-ups.
- Previous solutions are difficult to recall.
- Each meeting can start with limited context.

### With FUEGO

- Relevant customer history is recalled automatically.
- Previous commitments are surfaced.
- Successful and unsuccessful solutions are remembered.
- Teams can prepare for the next customer interaction with historical context.

## 🛠️ Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** Python, FastAPI
- **AI/LLM:** Groq
- **Memory:** Hindsight
- **Database:** SQLite
- **Deployment:** Render
- **Development:** GitHub Codespaces

## 🏗️ Architecture

```text
Customer Interactions
        ↓
   FastAPI Backend
        ↓
 ┌───────────────┐
 │    SQLite     │
 │ Source Data   │
 └───────────────┘
        +
 ┌───────────────┐
 │   Hindsight   │
 │ Persistent    │
 │    Memory     │
 └───────────────┘
        ↓
   Memory Recall
        ↓
      Groq
        ↓
Meeting Prep / Commitments /
Solution Memory / Ask FUEGO
        ↓
   Next.js Frontend


## 🎯 Objective

The goal of FUEGO is to demonstrate how persistent memory can make customer-facing AI agents more useful across multiple interactions by remembering relevant history instead of treating every interaction as a fresh conversation.

## 🔗 Links

### Live Demo

https://fuego-customer-memory-agent-1.onrender.com/

### GitHub

https://github.com/Samraatrichy/fuego-customer-memory-agent

### Hindsight

https://github.com/vectorize-io/hindsight
