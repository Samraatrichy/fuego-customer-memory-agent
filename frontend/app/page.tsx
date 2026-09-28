"use client";

import { useState } from "react";

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

export default function Home() {
  const [customer, setCustomer] = useState("Acme Corp");

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
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-orange-500"
              >
                <option>Acme Corp</option>
              </select>
            </div>

            <button
              onClick={prepareMeeting}
              disabled={loading}
              className="rounded-xl bg-orange-500 px-8 py-3 font-semibold text-white shadow-lg shadow-orange-500/10 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Preparing..." : "Prepare Meeting"}
            </button>
          </div>
        </section>


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
    "What solutions worked for Acme?",
    "What solutions partially worked?",
    "What issues are still open?",
    "What did we promise Acme?",
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
    lower.includes("acm-102") ||
    lower.includes("batch-based") ||
    lower.includes("worked");

  const hasPartial =
    lower.includes("acm-101") ||
    lower.includes("partially worked") ||
    lower.includes("partial");

  const hasOpen =
    lower.includes("acm-104") ||
    lower.includes("open support") ||
    lower.includes("monitoring");

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

        {/* Worked */}
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
                  Batch synchronization
                </h4>
              </div>

            </div>

            <p className="text-sm leading-6 text-slate-400">
              Batch-based processing improved synchronization reliability.
            </p>

          </div>
        )}


        {/* Partially Worked */}
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
                  Timeout adjustment
                </h4>
              </div>

            </div>

            <p className="text-sm leading-6 text-slate-400">
              Increasing timeout and retry settings reduced failures but did
              not eliminate them during larger loads.
            </p>

          </div>
        )}


        {/* Open Issue */}
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
                  Monitoring request
                </h4>
              </div>

            </div>

            <p className="text-sm leading-6 text-slate-400">
              Acme requested monitoring and alerts for SAP synchronization
              failures.
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