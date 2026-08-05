"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { askAI } from "@/lib/services/chat";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  sql?: string;
  result?: Record<string, unknown>[];
};

const suggestions = [
  "What drove the recent growth?",
  "Show me customer churn by region",
  "Generate SQL for the last 30 days",
];

const initialMessages: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "I can help analyze your uploaded data. Ask me anything about trends, SQL, or key metrics.",
    sql: "",
    result: [],
  },
];

export function ChatPanel() {
  const searchParams = useSearchParams();

const datasetId = searchParams?.get("dataset");
  const [messages, setMessages] =
  useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

const sendMessage = async () => {
  if (!input.trim()) return;

  if (!datasetId) {
  alert("No dataset selected.");
  return;
}

  const question = input.trim();

  setMessages((current) => [
    ...current,
    {
      role: "user",
      content: question,
    },
  ]);

  setInput("");
  setTyping(true);

  try {
  console.log("Dataset ID:", datasetId);

  const response = await askAI(
    datasetId,
    question
  );

  setMessages((current) => [
    ...current,
    {
      role: "assistant",
      content: "Query executed successfully.",
      sql: response.sql,
      result: response.result,
    },
  ]);
} catch (error) {
    console.error(error);

    setMessages((current) => [
  ...current,
  {
    role: "assistant",
    content: "Failed to execute the query.",
    sql: "",
    result: [],
  },
]);
  } finally {
    setTyping(false);
  }
};


  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="flex h-[640px] flex-col">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">AI Assistant</h3>
          <p className="mt-1 text-sm text-slate-400">Conversational analytics with SQL, explanations, and charts</p>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/70 p-4">
          {messages.map((message, index) => (
  <div
    key={`${message.role}-${index}`}
    className={`max-w-[90%] rounded-2xl p-4 ${
      message.role === "assistant"
        ? "bg-slate-900 text-slate-200"
        : "ml-auto bg-sky-500/15 text-sky-100"
    }`}
  >
    <p className="whitespace-pre-wrap">{message.content}</p>

    {message.sql && (
      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-sky-400">
          Generated SQL
        </p>

        <pre className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950 p-4 font-mono text-sm text-green-300">
{message.sql}
        </pre>
      </div>
    )}

    {message.result && message.result.length > 0 && (
      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-sky-400">
          Query Result
        </p>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-800">
              <tr>
                {Object.keys(message.result[0]).map((key) => (
                  <th
                    key={key}
                    className="px-4 py-3 text-slate-300"
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {message.result.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-t border-white/10"
                >
                  {Object.values(row).map((value, columnIndex) => (
                    <td
                      key={columnIndex}
                      className="px-4 py-3"
                    >
                      {String(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
))}

          {typing ? (
            <div className="max-w-[85%] rounded-2xl bg-slate-900 px-4 py-3 text-sm text-slate-300">
              <span className="inline-flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0.3s]" />
              </span>
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button key={suggestion} onClick={() => setInput(suggestion)} className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/20">
                {suggestion}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about your data..."
              className="flex-1 rounded-full border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none"
              onKeyDown={(event) => {
                if (event.key === "Enter") sendMessage();
              }}
            />
            <Button onClick={sendMessage}>Send</Button>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <Card>
          <h3 className="text-lg font-semibold text-white">Placeholder SQL Output</h3>
          <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/80 p-4 font-mono text-sm text-sky-200">
            SELECT region, SUM(revenue) FROM sales GROUP BY region;
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-white">Explanation</h3>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            This summary highlights the strongest-performing regions and points out where the growth trend is accelerating.
          </p>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-white">Charts</h3>
          <div className="mt-3 h-36 rounded-2xl bg-[linear-gradient(135deg,rgba(56,189,248,0.2),rgba(167,139,250,0.2))]" />
        </Card>
      </div>
    </div>
  )};

