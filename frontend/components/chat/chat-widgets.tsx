"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { askAI, type ChartConfig } from "@/lib/services/chat";
import { fetchDatasetById } from "@/lib/services/api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  type TooltipContentProps,
} from "recharts";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  sql?: string;
  result?: Record<string, unknown>[];
  explanation?: string;
  chart_config?: ChartConfig;
};

type StoredConversation = {
  dataset_id?: string;
  dataset_name?: string;
  id?: string;
  title?: string;
  time?: string;
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

function RenderChart({ chartConfig, data }: { chartConfig: ChartConfig; data: Record<string, unknown>[] }) {
  const { chart_type, x_key, y_keys } = chartConfig;
  
  if (!chart_type || chart_type === "none" || !x_key || !y_keys || y_keys.length === 0 || !data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-900/40 text-sm text-slate-400">
        No visual chart suitable for this data.
      </div>
    );
  }

  // Pre-configured premium color palettes
  const colors = ["#38bdf8", "#a78bfa", "#f43f5e", "#fbbf24", "#10b981"];

  // Custom Tooltip
  const customTooltip = (props: TooltipContentProps) => {
    const { active, payload, label } = props;
    const tooltipPayload = payload ?? [];

    if (active && tooltipPayload.length) {
      return (
        <div className="rounded-xl border border-white/10 bg-slate-950/95 p-3 text-xs shadow-xl backdrop-blur-md">
          <p className="font-semibold text-white mb-1">{`${x_key}: ${label ?? ""}`}</p>
          {tooltipPayload.map((pld, index) => (
            <p key={index} style={{ color: pld.color }}>
              {`${pld.name}: ${typeof pld.value === "number" ? pld.value.toLocaleString() : pld.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64 w-full mt-3">
      <ResponsiveContainer width="100%" height="100%">
        {chart_type === "bar" ? (
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey={x_key} stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip content={customTooltip} />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
            {y_keys.map((y_key, idx) => (
              <Bar key={y_key} dataKey={y_key} fill={colors[idx % colors.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        ) : chart_type === "line" ? (
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey={x_key} stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip content={customTooltip} />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
            {y_keys.map((y_key, idx) => (
              <Line key={y_key} type="monotone" dataKey={y_key} stroke={colors[idx % colors.length]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            ))}
          </LineChart>
        ) : chart_type === "area" ? (
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {y_keys.map((y_key, idx) => (
                <linearGradient key={y_key} id={`colorUv-${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[idx % colors.length]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors[idx % colors.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <XAxis dataKey={x_key} stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip content={customTooltip} />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
            {y_keys.map((y_key, idx) => (
              <Area key={y_key} type="monotone" dataKey={y_key} stroke={colors[idx % colors.length]} strokeWidth={2} fillOpacity={1} fill={`url(#colorUv-${idx})`} />
            ))}
          </AreaChart>
        ) : chart_type === "pie" ? (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={4}
              dataKey={y_keys[0]}
              nameKey={x_key}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={customTooltip} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
          </PieChart>
        ) : (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-900/40 text-sm text-slate-400">
            Unsupported chart type: {chart_type}
          </div>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export function ChatPanel() {
  const searchParams = useSearchParams();
  const datasetId = searchParams?.get("dataset");
  
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [datasetName, setDatasetName] = useState<string | null>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setMounted(true);
    });

    if (typeof window !== "undefined") {
      const draft = localStorage.getItem("chat_draft_question");
      if (draft) {
        setInput(draft);
        localStorage.removeItem("chat_draft_question");
      }
    }

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("dataset");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.dataset_id === datasetId) {
            setDatasetName(parsed.original_filename || parsed.filename || null);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [datasetId]);

  useEffect(() => {
    if (!datasetId) return;

    fetchDatasetById(datasetId)
      .then((data) => {
        if (data) {
          setDatasetName(data.original_filename || data.filename || null);
          if (typeof window !== "undefined") {
            localStorage.setItem("dataset", JSON.stringify(data));
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch active dataset details", err);
      });
  }, [datasetId]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    if (!datasetId) {
      if (typeof window !== "undefined") {
        try {
          const storedNotifs = localStorage.getItem("notifications");
          const list = storedNotifs ? JSON.parse(storedNotifs) : [];
          list.unshift({
            id: `no-dataset-${Date.now()}`,
            type: "warning",
            title: "Dataset unavailable",
            message: "Please upload or select a dataset before starting an analysis.",
            read: false,
            time: "Just now"
          });
          localStorage.setItem("notifications", JSON.stringify(list.slice(0, 20)));
        } catch (e) {
          console.error("Failed to save warning notification", e);
        }
      }
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

      const response = await askAI(datasetId, question);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.explanation || "Query executed successfully.",
          sql: response.sql,
          result: response.result,
          explanation: response.explanation,
          chart_config: response.chart_config,
        },
      ]);

      // Save to localStorage
      if (typeof window !== "undefined") {
        try {
          // 1. Update conversations
          const storedConvs = localStorage.getItem("conversations");
          const convs: StoredConversation[] = storedConvs ? JSON.parse(storedConvs) : [];
          const existingIdx = convs.findIndex((c) => c.dataset_id === datasetId);
          const activeDatasetStr = localStorage.getItem("dataset");
          const activeDatasetName = activeDatasetStr ? JSON.parse(activeDatasetStr).original_filename : "Dataset";

          const newConvo = {
            id: datasetId,
            dataset_id: datasetId,
            dataset_name: activeDatasetName,
            title: question.length > 30 ? question.slice(0, 30) + "..." : question,
            time: "Just now"
          };

          if (existingIdx > -1) {
            convs.splice(existingIdx, 1); // remove existing to move to top
          }
          convs.unshift(newConvo);
          localStorage.setItem("conversations", JSON.stringify(convs.slice(0, 10)));

          // 2. Update queries
          if (response.sql) {
            const storedQueries = localStorage.getItem("queries");
            const queriesList = storedQueries ? JSON.parse(storedQueries) : [];
            queriesList.unshift({
              question,
              time: "Just now",
              sql: response.sql
            });
            localStorage.setItem("queries", JSON.stringify(queriesList.slice(0, 10)));
          }

          // 3. Update notifications
          const storedNotifs = localStorage.getItem("notifications");
          const list = storedNotifs ? JSON.parse(storedNotifs) : [];
          list.unshift({
            id: `query-${Date.now()}`,
            type: "success",
            title: "Analysis complete",
            message: "Your query was executed successfully.",
            read: false,
            time: "Just now"
          });
          localStorage.setItem("notifications", JSON.stringify(list.slice(0, 20)));
        } catch (e) {
          console.error("Failed to save conversation/query to localStorage", e);
        }
      }
    } catch (error) {
      console.error(error);
      
      let errorMessage = "Unable to execute the generated SQL.";
      if (error instanceof Error) {
        const msg = error.message;
        const match = msg.match(/^\d+:\s*(.*)$/);
        errorMessage = match ? match[1] : msg;
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "Failed to execute the query.",
          sql: "",
          result: [],
        },
      ]);

      if (typeof window !== "undefined") {
        try {
          const storedNotifs = localStorage.getItem("notifications");
          const list = storedNotifs ? JSON.parse(storedNotifs) : [];
          list.unshift({
            id: `query-fail-${Date.now()}`,
            type: "error",
            title: "Query failed",
            message: errorMessage,
            read: false,
            time: "Just now"
          });
          localStorage.setItem("notifications", JSON.stringify(list.slice(0, 20)));
        } catch (e) {
          console.error("Failed to save query error notification", e);
        }
      }
    } finally {
      setTyping(false);
    }
  };

  // Find the latest assistant message that contains SQL/results for the sidebar
  const latestAssistantMessage = [...messages]
    .reverse()
    .find((msg) => msg.role === "assistant" && (msg.sql || msg.result));

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="flex h-[640px] flex-col">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">AI Assistant</h3>
            <p className="mt-1 text-sm text-slate-400">Conversational analytics with SQL, explanations, and charts</p>
          </div>
          {datasetName && (
            <div className="flex items-center gap-1.5 self-start rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-2xs font-medium text-sky-300 sm:self-center shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse shrink-0" />
              <span className="truncate max-w-[150px] inline-block" title={datasetName}>{datasetName}</span>
              {datasetName.includes("_cleaned_") && (
                <span className="rounded bg-sky-500/20 px-1 py-0.5 text-[9px] font-bold text-sky-400 uppercase tracking-wide shrink-0">
                  Cleaned
                </span>
              )}
            </div>
          )}
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

              {message.chart_config && message.result && message.result.length > 0 && (
                <div className="mt-4 border-t border-white/5 pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-sky-400">
                    Visual Chart
                  </p>
                  <RenderChart
                    chartConfig={message.chart_config}
                    data={message.result}
                  />
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
          <h3 className="text-lg font-semibold text-white">Generated SQL Output</h3>
          {latestAssistantMessage?.sql ? (
            <pre className="mt-3 overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/80 p-4 font-mono text-xs text-sky-200">
              {latestAssistantMessage.sql}
            </pre>
          ) : (
            <div className="mt-3 text-sm text-slate-400 italic">
              No query executed yet. Ask a question to generate SQL.
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-white">Explanation</h3>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {latestAssistantMessage?.explanation ? (
              latestAssistantMessage.explanation
            ) : (
              <span className="italic">No explanation available. Ask a question to analyze data.</span>
            )}
          </p>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-white">Charts</h3>
          {mounted && latestAssistantMessage?.chart_config && latestAssistantMessage?.result ? (
            <RenderChart
              chartConfig={latestAssistantMessage.chart_config}
              data={latestAssistantMessage.result}
            />
          ) : (
            <div className="mt-3 flex h-36 flex-col items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(56,189,248,0.05),rgba(167,139,250,0.05))] border border-white/5">
              <span className="text-2xl opacity-55">📊</span>
              <p className="text-xs text-slate-500 mt-2 italic">A visual chart will be generated here.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
