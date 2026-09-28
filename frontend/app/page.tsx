"use client";

import { useEffect, useState } from "react";

const API_URL =
  "https://vigilant-waddle-q7j7gpwq54r29469-8000.app.github.dev";

type BriefSection = {
  title: string;
  content: string;
};

type Commitment = {
  date: string;
  commitment: string;
  status: string;
  source: string;
};

type Solution = {
  ticket_id: string;
  date: string;
  issue: string;
  solution: string;
  outcome: string;
  result: string;
};

type Customer = {
  id: number;
  name: string;
};

export default function Home() {
  const [customer, setCustomer] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customerError, setCustomerError] = useState("");
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [addingCustomer, setAddingCustomer] = useState(false);

  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    title: "",
    participants: "",
    summary: "",
    decisions: "",
    commitments: "",
  });
  const [addingMeeting, setAddingMeeting] = useState(false);

  const [showAddTicket, setShowAddTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    ticket_id: "",
    date: new Date().toISOString().slice(0, 10),
    title: "",
    priority: "Medium",
    status: "Open",
    issue: "",
    solution: "",
    outcome: "",
  });
  const [addingTicket, setAddingTicket] = useState(false);

  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState("");
  const [memoryCount, setMemoryCount] = useState(0);

  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [commitmentsLoading, setCommitmentsLoading] = useState(false);
  const [commitmentsError, setCommitmentsError] = useState("");

  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [solutionsLoading, setSolutionsLoading] = useState(false);
  const [solutionsError, setSolutionsError] = useState("");


  // =========================================
  // LOAD CUSTOMERS
  // =========================================

  async function loadCustomers(selectFirst = false) {
    setCustomersLoading(true);
    setCustomerError("");

    try {
      const response = await fetch(`${API_URL}/customers`);

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();
      const list: Customer[] = data.customers ?? [];

      setCustomers(list);

      if (selectFirst && list.length > 0) {
        setCustomer(list[0].name);
      } else if (customer && !list.some((item) => item.name === customer)) {
        setCustomer(list.length > 0 ? list[0].name : "");
      } else if (!customer && list.length > 0) {
        setCustomer(list[0].name);
      }
    } catch (err) {
      setCustomerError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading customers."
      );
    } finally {
      setCustomersLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers(true);
  }, []);

  // =========================================
  // ADD CUSTOMER
  // =========================================

  async function createCustomer() {
    const name = newCustomerName.trim();

    if (!name) {
      return;
    }

    setAddingCustomer(true);
    setCustomerError("");

    try {
      const response = await fetch(`${API_URL}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail ?? `Request failed: ${response.status}`);
      }

      setNewCustomerName("");
      setShowAddCustomer(false);

      await loadCustomers();
      handleCustomerChange(name);
    } catch (err) {
      setCustomerError(
        err instanceof Error
          ? err.message
          : "Something went wrong while adding the customer."
      );
    } finally {
      setAddingCustomer(false);
    }
  }

  // =========================================
  // ADD MEETING
  // =========================================

  async function createMeeting() {
    if (!customer || !meetingForm.title.trim() || !meetingForm.summary.trim()) {
      return;
    }

    setAddingMeeting(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/customers/${encodeURIComponent(customer)}/meetings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: meetingForm.date,
            title: meetingForm.title.trim(),
            participants: meetingForm.participants
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            summary: meetingForm.summary.trim(),
            decisions: meetingForm.decisions
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean),
            commitments: meetingForm.commitments
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail ?? `Request failed: ${response.status}`);
      }

      setMeetingForm({
        date: new Date().toISOString().slice(0, 10),
        title: "",
        participants: "",
        summary: "",
        decisions: "",
        commitments: "",
      });

      setShowAddMeeting(false);
      setBrief("");
      setAnswer("");
      await loadCommitments();
      await loadSolutions();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while adding the meeting."
      );
    } finally {
      setAddingMeeting(false);
    }
  }

  // =========================================
  // ADD SUPPORT TICKET
  // =========================================

  async function createTicket() {
    if (
      !customer ||
      !ticketForm.ticket_id.trim() ||
      !ticketForm.title.trim() ||
      !ticketForm.issue.trim()
    ) {
      return;
    }

    setAddingTicket(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/customers/${encodeURIComponent(customer)}/tickets`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ticket_id: ticketForm.ticket_id.trim(),
            date: ticketForm.date,
            title: ticketForm.title.trim(),
            priority: ticketForm.priority,
            status: ticketForm.status,
            issue: ticketForm.issue.trim(),
            solution: ticketForm.solution.trim(),
            outcome: ticketForm.outcome.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail ?? `Request failed: ${response.status}`);
      }

      setTicketForm({
        ticket_id: "",
        date: new Date().toISOString().slice(0, 10),
        title: "",
        priority: "Medium",
        status: "Open",
        issue: "",
        solution: "",
        outcome: "",
      });

      setShowAddTicket(false);
      setBrief("");
      setAnswer("");
      await loadCommitments();
      await loadSolutions();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while adding the support ticket."
      );
    } finally {
      setAddingTicket(false);
    }
  }

  async function prepareMeeting() {
    setLoading(true);
    setError("");
    setBrief("");

    try {
      const response = await fetch(`${API_URL}/meeting/prepare`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customer }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();
      setBrief(data.meeting_brief);

      // Load customer follow-ups and solution history
      await loadCommitments();
      await loadSolutions();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while preparing the meeting."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadCommitments() {
    setCommitmentsLoading(true);
    setCommitmentsError("");

    try {
      const response = await fetch(
        `${API_URL}/commitments/${encodeURIComponent(customer)}`
      );

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();

      setCommitments(data.commitments ?? []);
    } catch (err) {
      setCommitmentsError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading commitments."
      );
    } finally {
      setCommitmentsLoading(false);
    }
  }

  async function loadSolutions() {
    setSolutionsLoading(true);
    setSolutionsError("");

    try {
      const response = await fetch(
        `${API_URL}/solutions/${encodeURIComponent(customer)}`
      );

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();

      setSolutions(data.solutions ?? []);
    } catch (err) {
      setSolutionsError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading solution memory."
      );
    } finally {
      setSolutionsLoading(false);
    }
  }

  async function askFuego(customQuestion?: string) {
    const questionToAsk = (customQuestion ?? question).trim();

    if (!questionToAsk) {
      return;
    }

    setAsking(true);
    setAskError("");
    setAnswer("");
    setMemoryCount(0);

    try {
      const response = await fetch(`${API_URL}/memory/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer,
          question: questionToAsk,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();

      setAnswer(data.answer);
      setMemoryCount(data.memory_recalled ?? 0);
      setQuestion(questionToAsk);
    } catch (err) {
      setAskError(
        err instanceof Error
          ? err.message
          : "Something went wrong while asking FUEGO."
      );
    } finally {
      setAsking(false);
    }
  }

  function handleQuestionKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter" && !asking) {
      askFuego();
    }
  }

  function handleCustomerChange(value: string) {
    setCustomer(value);
    setBrief("");
    setAnswer("");
    setQuestion("");
    setAskError("");
    setMemoryCount(0);

    setCommitments([]);
    setCommitmentsError("");

    setSolutions([]);
    setSolutionsError("");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* Header */}
        <header className="mb-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-lg font-bold shadow-lg shadow-orange-500/20">
                F
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  FUEGO
                </h1>

                <p className="text-sm text-slate-400">
                  Customer Relationship Memory Agent
                </p>
              </div>
            </div>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-sm text-green-300">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            Hindsight Memory Active
          </div>
        </header>


        {/* Hero */}
        <section className="mb-10">
          <div className="max-w-4xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-orange-400">
              AI Customer Memory
            </p>

            <h2 className="text-4xl font-bold leading-tight md:text-6xl">
              Never walk into a customer meeting without the full history.
            </h2>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
              FUEGO remembers meetings, support issues, commitments, and
              solutions so your team can prepare smarter for every customer
              interaction.
            </p>
          </div>
        </section>


        {/* Customer Selector */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Customer
              </label>

              <select
                value={customer}
                onChange={(e) => handleCustomerChange(e.target.value)}
                disabled={customersLoading || customers.length === 0}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-orange-500 disabled:opacity-60"
              >
                {customers.length === 0 ? (
                  <option value="">
                    {customersLoading ? "Loading customers..." : "No customers yet"}
                  </option>
                ) : (
                  customers.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <button
              onClick={prepareMeeting}
              disabled={loading || !customer}
              className="rounded-xl bg-orange-500 px-8 py-3 font-semibold text-white shadow-lg shadow-orange-500/10 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Preparing..." : "Prepare Meeting"}
            </button>

            <button
              onClick={() => setShowAddCustomer((value) => !value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 font-semibold text-slate-200 transition hover:border-orange-500/50 hover:text-white"
            >
              + Add Customer
            </button>
          </div>

          {customerError && (
            <p className="mt-3 text-sm text-red-300">{customerError}</p>
          )}

          {showAddCustomer && (
            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-5">
              <p className="font-semibold text-slate-100">Add a customer</p>
              <p className="mt-1 text-sm text-slate-500">
                Customer records are stored in SQLite and their identity is remembered by Hindsight.
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="e.g. Contoso Technologies"
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500"
                />

                <button
                  onClick={createCustomer}
                  disabled={addingCustomer || !newCustomerName.trim()}
                  className="rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-400 disabled:opacity-50"
                >
                  {addingCustomer ? "Adding..." : "Add Customer"}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Data Entry */}
        {customer && (
          <section className="mt-6 grid gap-5 md:grid-cols-2">
            {/* Add Meeting */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
                    Customer Record
                  </p>
                  <h3 className="mt-1 text-xl font-bold">Add Meeting</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Store a new interaction and teach FUEGO about it.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddMeeting((value) => !value)}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-orange-500/50"
                >
                  {showAddMeeting ? "Close" : "+ Add"}
                </button>
              </div>

              {showAddMeeting && (
                <div className="mt-5 space-y-3">
                  <input
                    type="date"
                    value={meetingForm.date}
                    onChange={(e) =>
                      setMeetingForm({ ...meetingForm, date: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
                  />

                  <input
                    value={meetingForm.title}
                    onChange={(e) =>
                      setMeetingForm({ ...meetingForm, title: e.target.value })
                    }
                    placeholder="Meeting title"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600"
                  />

                  <input
                    value={meetingForm.participants}
                    onChange={(e) =>
                      setMeetingForm({
                        ...meetingForm,
                        participants: e.target.value,
                      })
                    }
                    placeholder="Participants, separated by commas"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600"
                  />

                  <textarea
                    value={meetingForm.summary}
                    onChange={(e) =>
                      setMeetingForm({ ...meetingForm, summary: e.target.value })
                    }
                    placeholder="What happened in the meeting?"
                    rows={3}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600"
                  />

                  <textarea
                    value={meetingForm.decisions}
                    onChange={(e) =>
                      setMeetingForm({
                        ...meetingForm,
                        decisions: e.target.value,
                      })
                    }
                    placeholder="Decisions — one per line"
                    rows={2}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600"
                  />

                  <textarea
                    value={meetingForm.commitments}
                    onChange={(e) =>
                      setMeetingForm({
                        ...meetingForm,
                        commitments: e.target.value,
                      })
                    }
                    placeholder="Commitments — one per line"
                    rows={2}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600"
                  />

                  <button
                    onClick={createMeeting}
                    disabled={
                      addingMeeting ||
                      !meetingForm.title.trim() ||
                      !meetingForm.summary.trim()
                    }
                    className="w-full rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-400 disabled:opacity-50"
                  >
                    {addingMeeting ? "Saving..." : "Save Meeting"}
                  </button>
                </div>
              )}
            </div>

            {/* Add Support Ticket */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-400">
                    Customer Record
                  </p>
                  <h3 className="mt-1 text-xl font-bold">Add Support Ticket</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Record issues, solutions and outcomes for future recall.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddTicket((value) => !value)}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-green-500/50"
                >
                  {showAddTicket ? "Close" : "+ Add"}
                </button>
              </div>

              {showAddTicket && (
                <div className="mt-5 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={ticketForm.ticket_id}
                      onChange={(e) =>
                        setTicketForm({
                          ...ticketForm,
                          ticket_id: e.target.value,
                        })
                      }
                      placeholder="Ticket ID, e.g. CON-101"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600"
                    />

                    <input
                      type="date"
                      value={ticketForm.date}
                      onChange={(e) =>
                        setTicketForm({ ...ticketForm, date: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
                    />
                  </div>

                  <input
                    value={ticketForm.title}
                    onChange={(e) =>
                      setTicketForm({ ...ticketForm, title: e.target.value })
                    }
                    placeholder="Ticket title"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600"
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      value={ticketForm.priority}
                      onChange={(e) =>
                        setTicketForm({
                          ...ticketForm,
                          priority: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Critical</option>
                    </select>

                    <select
                      value={ticketForm.status}
                      onChange={(e) =>
                        setTicketForm({
                          ...ticketForm,
                          status: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
                    >
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Resolved</option>
                      <option>Closed</option>
                    </select>
                  </div>

                  <textarea
                    value={ticketForm.issue}
                    onChange={(e) =>
                      setTicketForm({ ...ticketForm, issue: e.target.value })
                    }
                    placeholder="Describe the customer issue"
                    rows={3}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600"
                  />

                  <textarea
                    value={ticketForm.solution}
                    onChange={(e) =>
                      setTicketForm({
                        ...ticketForm,
                        solution: e.target.value,
                      })
                    }
                    placeholder="Solution attempted"
                    rows={2}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600"
                  />

                  <textarea
                    value={ticketForm.outcome}
                    onChange={(e) =>
                      setTicketForm({
                        ...ticketForm,
                        outcome: e.target.value,
                      })
                    }
                    placeholder="Outcome, e.g. Worked / Partially worked / Not confirmed"
                    rows={2}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600"
                  />

                  <button
                    onClick={createTicket}
                    disabled={
                      addingTicket ||
                      !ticketForm.ticket_id.trim() ||
                      !ticketForm.title.trim() ||
                      !ticketForm.issue.trim()
                    }
                    className="w-full rounded-xl bg-green-500 px-5 py-3 font-semibold text-slate-950 hover:bg-green-400 disabled:opacity-50"
                  >
                    {addingTicket ? "Saving..." : "Save Support Ticket"}
                  </button>
                </div>
              )}
            </div>
          </section>
        )}



        {/* Loading */}
        {loading && (
          <div className="mt-8 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-10 text-center">
            <div className="mx-auto mb-5 h-9 w-9 animate-spin rounded-full border-2 border-slate-700 border-t-orange-500" />

            <p className="font-semibold">
              Recalling customer memory...
            </p>

            <p className="mt-2 text-sm text-slate-400">
              Hindsight is retrieving relevant history and FUEGO is preparing
              your meeting brief.
            </p>
          </div>
        )}


        {/* Error */}
        {error && (
          <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
            <p className="font-semibold">
              Something went wrong
            </p>

            <p className="mt-1 text-sm">
              {error}
            </p>
          </div>
        )}


        {/* Meeting Brief */}
        {brief && !loading && (
          <MeetingBrief
            customer={customer}
            brief={brief}
          />
        )}


        {/* Solution Memory */}
        {brief && !loading && (
          <SolutionMemory
            customer={customer}
            solutions={solutions}
            loading={solutionsLoading}
            error={solutionsError}
            onRefresh={loadSolutions}
          />
        )}


        {/* Commitment Tracker */}
        {brief && !loading && (
          <CommitmentTracker
            customer={customer}
            commitments={commitments}
            loading={commitmentsLoading}
            error={commitmentsError}
            onRefresh={loadCommitments}
          />
        )}


        {/* Empty State */}
        {!brief && !loading && !error && (
          <section className="mt-8 grid gap-5 md:grid-cols-3">
            <Feature
              icon="🧠"
              title="Persistent Memory"
              description="Remembers customer interactions across meetings and support history."
            />

            <Feature
              icon="🔧"
              title="Solution Memory"
              description="Knows which solutions worked and which only partially worked."
            />

            <Feature
              icon="🎯"
              title="Actionable Context"
              description="Turns customer history into preparation for the next conversation."
            />
          </section>
        )}


        {/* Ask FUEGO */}
        <AskFuego
          customer={customer}
          question={question}
          setQuestion={setQuestion}
          answer={answer}
          asking={asking}
          error={askError}
          memoryCount={memoryCount}
          onAsk={askFuego}
          onKeyDown={handleQuestionKeyDown}
        />


        {/* Footer */}
        <footer className="mt-12 border-t border-slate-800 pt-6 text-center text-sm text-slate-500">
          FUEGO • Powered by Hindsight + Groq
        </footer>
      </div>
    </main>
  );
}


/* =========================================
   SOLUTION MEMORY
========================================= */

function SolutionMemory({
  customer,
  solutions,
  loading,
  error,
  onRefresh,
}: {
  customer: string;
  solutions: Solution[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
}) {
  const workedCount = solutions.filter(
    (item) => item.result === "Worked"
  ).length;

  const partialCount = solutions.filter(
    (item) => item.result === "Partially worked"
  ).length;

  const notConfirmedCount = solutions.filter(
    (item) => item.result === "Not confirmed"
  ).length;

  return (
    <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">

      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-800 px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-400">
            ✓
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-400">
              Hindsight Learning
            </p>

            <h3 className="mt-1 text-xl font-bold">
              Solution Memory
            </h3>

            <p className="text-sm text-slate-400">
              What FUEGO remembers about solutions tried with {customer}.
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300 transition hover:border-green-500/50 hover:text-white disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>


      {/* Summary */}
      {!loading && !error && (
        <div className="grid gap-3 border-b border-slate-800 p-5 md:grid-cols-3">

          {/* Worked */}
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
            <p className="text-xs uppercase tracking-wider text-green-400">
              Worked
            </p>

            <p className="mt-1 text-2xl font-bold text-green-300">
              {workedCount}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Successful solutions
            </p>
          </div>


          {/* Partial */}
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
            <p className="text-xs uppercase tracking-wider text-yellow-400">
              Partially worked
            </p>

            <p className="mt-1 text-2xl font-bold text-yellow-300">
              {partialCount}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Reduced the issue but did not fully resolve it
            </p>
          </div>


          {/* Not confirmed */}
          <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Not confirmed
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-200">
              {notConfirmedCount}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Outcome not confirmed
            </p>
          </div>

        </div>
      )}


      {/* Loading */}
      {loading && (
        <div className="p-8 text-center">
          <div className="mx-auto mb-4 h-7 w-7 animate-spin rounded-full border-2 border-slate-700 border-t-green-500" />

          <p className="font-medium">
            Loading solution memory...
          </p>

          <p className="mt-1 text-sm text-slate-500">
            FUEGO is checking previously recorded solutions and outcomes.
          </p>
        </div>
      )}


      {/* Error */}
      {error && !loading && (
        <div className="p-6">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
            <p className="font-semibold">
              Unable to load solution memory
            </p>

            <p className="mt-1 text-sm">
              {error}
            </p>
          </div>
        </div>
      )}


      {/* Empty */}
      {!loading && !error && solutions.length === 0 && (
        <div className="p-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-800">
            ✓
          </div>

          <p className="font-medium">
            No solution history found
          </p>

          <p className="mt-1 text-sm text-slate-500">
            No documented support solutions were found for this customer.
          </p>
        </div>
      )}


      {/* Solution List */}
      {!loading && !error && solutions.length > 0 && (
        <div className="p-5">
          <div className="overflow-x-auto rounded-xl border border-slate-800">

            <table className="w-full min-w-[1000px] text-left text-sm">

              <thead className="bg-slate-950">
                <tr>

                  <th className="border-b border-slate-800 px-4 py-3 font-semibold text-slate-200">
                    Date
                  </th>

                  <th className="border-b border-slate-800 px-4 py-3 font-semibold text-slate-200">
                    Ticket
                  </th>

                  <th className="border-b border-slate-800 px-4 py-3 font-semibold text-slate-200">
                    Issue
                  </th>

                  <th className="border-b border-slate-800 px-4 py-3 font-semibold text-slate-200">
                    Solution Tried
                  </th>

                  <th className="border-b border-slate-800 px-4 py-3 font-semibold text-slate-200">
                    Result
                  </th>

                </tr>
              </thead>

              <tbody>
                {solutions.map((item, index) => (
                  <tr
                    key={`${item.ticket_id}-${index}`}
                    className="border-b border-slate-800 last:border-b-0"
                  >

                    <td className="whitespace-nowrap px-4 py-4 align-top text-slate-400">
                      {item.date}
                    </td>

                    <td className="px-4 py-4 align-top">
                      <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300">
                        {item.ticket_id}
                      </span>
                    </td>

                    <td className="max-w-[250px] px-4 py-4 align-top">
                      <p className="leading-6 text-slate-300">
                        {item.issue}
                      </p>
                    </td>

                    <td className="max-w-[300px] px-4 py-4 align-top">
                      <p className="font-medium leading-6 text-slate-200">
                        {item.solution}
                      </p>
                    </td>

                    <td className="max-w-[280px] px-4 py-4 align-top">
                      <SolutionResult result={item.result} />

                      <p className="mt-2 leading-5 text-slate-500">
                        {item.outcome}
                      </p>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>

          </div>

          <div className="mt-4 rounded-xl border border-green-500/10 bg-green-500/5 p-4">
            <p className="text-xs leading-5 text-slate-400">
              <span className="font-semibold text-green-400">
                Memory insight:
              </span>{" "}
              FUEGO uses documented past outcomes to distinguish solutions
              that worked from solutions that only partially worked. It does
              not assume success when the customer records do not confirm it.
            </p>
          </div>

        </div>
      )}

    </section>
  );
}


/* =========================================
   SOLUTION RESULT
========================================= */

function SolutionResult({
  result,
}: {
  result: string;
}) {
  if (result === "Worked") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-300">
        <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
        Worked
      </span>
    );
  }

  if (result === "Partially worked") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-300">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
        Partially worked
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      Not confirmed
    </span>
  );
}


/* =========================================
   COMMITMENT TRACKER
========================================= */

function CommitmentTracker({
  customer,
  commitments,
  loading,
  error,
  onRefresh,
}: {
  customer: string;
  commitments: Commitment[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
}) {
  const openCount = commitments.filter(
    (item) => item.status === "Open"
  ).length;

  const confirmationCount = commitments.filter(
    (item) => item.status === "Needs confirmation"
  ).length;

  return (
    <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">

      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-800 px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
            ✓
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
              Follow-up Memory
            </p>

            <h3 className="mt-1 text-xl font-bold">
              Commitment Tracker
            </h3>

            <p className="text-sm text-slate-400">
              Commitments and customer requests remembered for {customer}.
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300 transition hover:border-orange-500/50 hover:text-white disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>


      {/* Summary */}
      {!loading && !error && (
        <div className="grid gap-3 border-b border-slate-800 p-5 md:grid-cols-3">

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Total
            </p>

            <p className="mt-1 text-2xl font-bold text-white">
              {commitments.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Recorded follow-ups
            </p>
          </div>


          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
            <p className="text-xs uppercase tracking-wider text-yellow-400">
              Needs confirmation
            </p>

            <p className="mt-1 text-2xl font-bold text-yellow-300">
              {confirmationCount}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Completion not confirmed
            </p>
          </div>


          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
            <p className="text-xs uppercase tracking-wider text-orange-400">
              Open
            </p>

            <p className="mt-1 text-2xl font-bold text-orange-300">
              {openCount}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Active customer requests
            </p>
          </div>

        </div>
      )}


      {/* Loading */}
      {loading && (
        <div className="p-8 text-center">
          <div className="mx-auto mb-4 h-7 w-7 animate-spin rounded-full border-2 border-slate-700 border-t-orange-500" />

          <p className="font-medium">
            Loading commitments...
          </p>

          <p className="mt-1 text-sm text-slate-500">
            FUEGO is checking the customer history.
          </p>
        </div>
      )}


      {/* Error */}
      {error && !loading && (
        <div className="p-6">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
            <p className="font-semibold">
              Unable to load commitments
            </p>

            <p className="mt-1 text-sm">
              {error}
            </p>
          </div>
        </div>
      )}


      {/* Empty */}
      {!loading && !error && commitments.length === 0 && (
        <div className="p-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-800">
            ✓
          </div>

          <p className="font-medium">
            No commitments found
          </p>

          <p className="mt-1 text-sm text-slate-500">
            No documented follow-ups were found for this customer.
          </p>
        </div>
      )}


      {/* Commitment List */}
      {!loading && !error && commitments.length > 0 && (
        <div className="p-5">
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-[700px] text-left text-sm">

              <thead className="bg-slate-950">
                <tr>
                  <th className="border-b border-slate-800 px-4 py-3 font-semibold text-slate-200">
                    Date
                  </th>

                  <th className="border-b border-slate-800 px-4 py-3 font-semibold text-slate-200">
                    Commitment / Request
                  </th>

                  <th className="border-b border-slate-800 px-4 py-3 font-semibold text-slate-200">
                    Status
                  </th>

                  <th className="border-b border-slate-800 px-4 py-3 font-semibold text-slate-200">
                    Source
                  </th>
                </tr>
              </thead>

              <tbody>
                {commitments.map((item, index) => (
                  <tr
                    key={`${item.date}-${item.commitment}-${index}`}
                    className="border-b border-slate-800 last:border-b-0"
                  >

                    <td className="whitespace-nowrap px-4 py-4 align-top text-slate-400">
                      {item.date}
                    </td>

                    <td className="px-4 py-4 align-top">
                      <p className="font-medium text-slate-200">
                        {item.commitment}
                      </p>
                    </td>

                    <td className="px-4 py-4 align-top">
                      <CommitmentStatus status={item.status} />
                    </td>

                    <td className="px-4 py-4 align-top">
                      <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-400">
                        {item.source}
                      </span>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Statuses are based only on documented customer records. FUEGO
            does not assume a commitment was completed unless the records
            explicitly confirm it.
          </p>
        </div>
      )}

    </section>
  );
}


/* =========================================
   COMMITMENT STATUS
========================================= */

function CommitmentStatus({
  status,
}: {
  status: string;
}) {
  if (status === "Open") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-300">
        <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
        Open
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-300">
      <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
      Needs confirmation
    </span>
  );
}


/* =========================================
   ASK FUEGO
========================================= */

function AskFuego({
  customer,
  question,
  setQuestion,
  answer,
  asking,
  error,
  memoryCount,
  onAsk,
  onKeyDown,
}: {
  customer: string;
  question: string;
  setQuestion: (value: string) => void;
  answer: string;
  asking: boolean;
  error: string;
  memoryCount: number;
  onAsk: (question?: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  const suggestedQuestions = [
    `What solutions worked for ${customer}?`,
    "What solutions partially worked?",
    "What issues are still open?",
    `What did we promise ${customer}?`,
  ];

  return (
    <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
            ✦
          </div>

          <div>
            <h3 className="text-xl font-bold">
              Ask FUEGO
            </h3>

            <p className="text-sm text-slate-400">
              Ask anything about {customer}&apos;s customer history.
            </p>
          </div>
        </div>
      </div>


      {/* Question Input */}
      <div className="flex flex-col gap-3 md:flex-row">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask about previous solutions, issues, commitments..."
          className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-orange-500"
        />

        <button
          onClick={() => onAsk()}
          disabled={asking || !question.trim()}
          className="rounded-xl bg-orange-500 px-7 py-3 font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {asking ? "Thinking..." : "Ask FUEGO"}
        </button>
      </div>


      {/* Suggested Questions */}
      <div className="mt-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Try asking
        </p>

        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((item) => (
            <button
              key={item}
              onClick={() => {
                setQuestion(item);
                onAsk(item);
              }}
              disabled={asking}
              className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300 transition hover:border-orange-500/50 hover:text-white disabled:opacity-50"
            >
              {item}
            </button>
          ))}
        </div>
      </div>


      {/* Loading */}
      {asking && (
        <div className="mt-6 rounded-xl border border-orange-500/20 bg-orange-500/5 p-5">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-orange-500" />

            <div>
              <p className="font-medium">
                Searching customer memory...
              </p>

              <p className="text-sm text-slate-400">
                Hindsight is recalling relevant historical context.
              </p>
            </div>
          </div>
        </div>
      )}


      {/* Ask Error */}
      {error && !asking && (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
          <p className="font-semibold">
            Unable to answer
          </p>

          <p className="mt-1 text-sm">
            {error}
          </p>
        </div>
      )}


      {/* Answer */}
      {answer && !asking && (
        <div className="mt-6 overflow-hidden rounded-xl border border-green-500/20 bg-slate-950">

          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-400">
                ✓
              </div>

              <div>
                <p className="text-sm font-semibold">
                  FUEGO&apos;s Answer
                </p>

                <p className="text-xs text-slate-500">
                  Grounded in Hindsight memory + customer records
                </p>
              </div>
            </div>

            {memoryCount > 0 && (
              <div className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs text-green-300">
                {memoryCount} memories recalled
              </div>
            )}

          </div>

          <div className="px-5 py-5 text-sm leading-7 text-slate-300">
            <AnswerContent answer={answer} />
          </div>

        </div>
      )}

    </section>
  );
}


/* =========================================
   MEETING BRIEF
========================================= */

function MeetingBrief({
  customer,
  brief,
}: {
  customer: string;
  brief: string;
}) {
  const sections = parseBrief(brief);

  return (
    <section className="mt-8">

      {/* Brief Header */}
      <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-400">
                ✓
              </div>

              <div>
                <h3 className="text-xl font-bold">
                  AI Meeting Brief
                </h3>

                <p className="text-sm text-slate-400">
                  Prepared for {customer}
                </p>
              </div>

            </div>
          </div>

          <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs font-medium text-green-300">
            Memory recalled successfully
          </div>

        </div>
      </div>


      {/* Memory Insights */}
      <MemoryInsights brief={brief} />


      {/* AI Sections */}
      {sections.map((section, index) => (
        <BriefCard
          key={`${section.title}-${index}`}
          title={section.title}
          content={section.content}
          index={index}
        />
      ))}

    </section>
  );
}


/* =========================================
   MEMORY INSIGHTS
========================================= */

function MemoryInsights({
  brief,
}: {
  brief: string;
}) {
  const lower = brief.toLowerCase();

  const hasWorked =
    lower.includes("solutions that worked") &&
    !lower.includes("none documented");

  const hasPartial =
    lower.includes("partially worked") ||
    lower.includes("partially resolved") ||
    lower.includes("partial");

  const hasOpen =
    lower.includes("open support issues") &&
    !lower.includes("none recorded");

  return (
    <section className="mb-6">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
          Hindsight Memory
        </p>

        <h3 className="mt-1 text-2xl font-bold">
          What FUEGO remembers
        </h3>

        <p className="mt-1 text-sm text-slate-400">
          Historical context recalled from previous customer interactions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {hasWorked && (
          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10 text-green-400">
                ✓
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-green-400">
                  Worked
                </p>

                <h4 className="font-semibold">
                  Successful solution found
                </h4>
              </div>
            </div>

            <p className="text-sm leading-6 text-slate-400">
              FUEGO found a documented solution with a successful outcome in
              this customer&apos;s history.
            </p>
          </div>
        )}

        {hasPartial && (
          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-400">
                !
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-yellow-400">
                  Partially worked
                </p>

                <h4 className="font-semibold">
                  Previous approach had limits
                </h4>
              </div>
            </div>

            <p className="text-sm leading-6 text-slate-400">
              FUEGO found a documented partial outcome and will keep that
              context in mind for future interactions.
            </p>
          </div>
        )}

        {hasOpen && (
          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                !
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-orange-400">
                  Open issue
                </p>

                <h4 className="font-semibold">
                  Customer follow-up required
                </h4>
              </div>
            </div>

            <p className="text-sm leading-6 text-slate-400">
              FUEGO found an explicitly open support issue in the customer
              records.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}


/* =========================================
   PARSE AI MARKDOWN
========================================= */

function parseBrief(text: string): BriefSection[] {
  const cleaned = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\r/g, "")
    .replace(/^[-–—]{2,}$/gm, "")
    .trim();

  const matches = [
    ...cleaned.matchAll(
      /(?:^|\n)\s*\**(\d+)\.\s*([^*\n]+?)\s*\**\s*(?:\n|$)/g
    ),
  ];

  if (matches.length === 0) {
    return [
      {
        title: "Meeting Brief",
        content: cleaned,
      },
    ];
  }

  const sections: BriefSection[] = [];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];

    const title = `${match[1]}. ${match[2].trim()}`;

    const start = (match.index ?? 0) + match[0].length;

    const end =
      i + 1 < matches.length
        ? matches[i + 1].index ?? cleaned.length
        : cleaned.length;

    const content = cleaned
      .slice(start, end)
      .trim()
      .replace(/^[-–—]{2,}$/gm, "")
      .trim();

    sections.push({
      title,
      content,
    });
  }

  return sections;
}


/* =========================================
   BRIEF CARD
========================================= */

function BriefCard({
  title,
  content,
  index,
}: {
  title: string;
  content: string;
  index: number;
}) {
  const lowerTitle = title.toLowerCase();

  const isImportant =
    lowerTitle.includes("open") ||
    lowerTitle.includes("failed") ||
    lowerTitle.includes("follow");

  return (
    <div
      className={`mb-5 overflow-hidden rounded-2xl border bg-slate-900 ${
        isImportant
          ? "border-orange-500/20"
          : "border-slate-800"
      }`}
    >

      <div className="flex items-center gap-3 border-b border-slate-800 px-6 py-4">

        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
            isImportant
              ? "bg-orange-500/10 text-orange-400"
              : "bg-slate-800 text-slate-300"
          }`}
        >
          {index + 1}
        </div>

        <h4 className="font-semibold text-slate-100">
          {title.replace(/^\d+\.\s*/, "")}
        </h4>

      </div>


      <div className="px-6 py-6">
        <FormattedContent content={content} />
      </div>

    </div>
  );
}


/* =========================================
   CONTENT FORMATTER
========================================= */

function FormattedContent({
  content,
}: {
  content: string;
}) {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const tableLines = lines.filter((line) =>
    line.startsWith("|")
  );

  if (tableLines.length >= 2) {
    return <MarkdownTable lines={tableLines} />;
  }

  return (
    <div className="space-y-3 text-sm leading-7 text-slate-300">

      {lines.map((line, index) => {

        const cleaned = line
          .replace(/^\*\s*/, "")
          .replace(/^-\s*/, "")
          .replace(/^\d+\.\s*/, "")
          .trim();

        if (line.startsWith("-") || line.startsWith("*")) {
          return (
            <div
              key={index}
              className="flex gap-3"
            >
              <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />

              <span>
                {formatBold(cleaned)}
              </span>
            </div>
          );
        }

        return (
          <p key={index}>
            {formatBold(cleaned)}
          </p>
        );
      })}

    </div>
  );
}


/* =========================================
   MARKDOWN TABLE
========================================= */

function MarkdownTable({
  lines,
}: {
  lines: string[];
}) {
  const rows = lines
    .filter((line) => !/^\|\s*-+/.test(line))
    .map((line) =>
      line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim())
    );

  if (rows.length === 0) {
    return null;
  }

  const headers = rows[0];
  const body = rows.slice(1);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">

      <table className="w-full min-w-[800px] text-left text-sm">

        <thead className="bg-slate-950">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="border-b border-slate-800 px-4 py-3 font-semibold text-slate-200"
              >
                {formatBold(header)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {body.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-slate-800 last:border-b-0"
            >

              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-4 py-4 align-top leading-6 text-slate-400"
                >
                  {formatBold(cell)}
                </td>
              ))}

            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
}


/* =========================================
   ANSWER CONTENT
========================================= */

function AnswerContent({
  answer,
}: {
  answer: string;
}) {
  const lines = answer
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const tableLines = lines.filter((line) =>
    line.startsWith("|")
  );

  if (tableLines.length >= 2) {
    return <MarkdownTable lines={tableLines} />;
  }

  return (
    <div className="space-y-3">

      {lines.map((line, index) => {

        const cleaned = line
          .replace(/^[-•]\s*/, "")
          .trim();

        if (line.startsWith("-") || line.startsWith("•")) {
          return (
            <div
              key={index}
              className="flex gap-3"
            >

              <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />

              <span>
                {formatBold(cleaned)}
              </span>

            </div>
          );
        }

        return (
          <p key={index}>
            {formatBold(cleaned)}
          </p>
        );
      })}

    </div>
  );
}


/* =========================================
   BOLD TEXT
========================================= */

function formatBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, index) => {

    if (
      part.startsWith("**") &&
      part.endsWith("**")
    ) {
      return (
        <strong
          key={index}
          className="font-semibold text-slate-100"
        >
          {part.slice(2, -2)}
        </strong>
      );
    }

    return part;
  });
}


/* =========================================
   FEATURE CARD
========================================= */

function Feature({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-700">

      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-lg">
        {icon}
      </div>

      <h3 className="font-semibold text-slate-100">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        {description}
      </p>

    </div>
  );
}