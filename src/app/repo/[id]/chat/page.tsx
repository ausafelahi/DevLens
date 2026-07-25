"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { MessageContent } from "@/components/chat/MessageContent";
import { ThinkingSteps } from "@/components/chat/ThinkingSteps";
import { FadeIn } from "@/components/chat/FadeIn";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  relatedFiles: string[];
};

export default function ChatPage() {
  const { id: repositoryId } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAsk = async () => {
    if (!question.trim()) return;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
      relatedFiles: [],
    };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setAsking(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId, question: userMsg.content }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.answer,
            relatedFiles: data.relatedFiles ?? [],
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Something went wrong: ${data.error}`,
            relatedFiles: [],
          },
        ]);
      }
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)] text-[var(--color-fg)]">
      <header className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
        <div
          className="flex items-center gap-2 text-sm text-[var(--color-muted)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <span className="text-[var(--color-accent)]">◆</span>
          <span>You're exploring an unfamiliar codebase — ask anything</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href={`/repo/${repositoryId}/architecture`}
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]"
          >
            Architecture map →
          </Link>
          <Link
            href={`/repo/${repositoryId}/root-cause`}
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]"
          >
            Debug an error →
          </Link>
          <Link
            href={`/repo/${repositoryId}/code-review`}
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]"
          >
            Code review →
          </Link>
          <Link
            href={`/repo/${repositoryId}/dependencies`}
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]"
          >
            Dependencies →
          </Link>
          <Link
            href={`/repo/${repositoryId}/tech-debt`}
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]"
          >
            Tech debt →
          </Link>
          <Link
            href={`/repo/${repositoryId}/documentation`}
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]"
          >
            Docs →
          </Link>
          <UserButton />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-8">
        {messages.length === 0 && (
          <div className="mt-16 text-center">
            <p className="text-lg text-[var(--color-muted)]">
              Where should we start?
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {[
                "Where does the app start running?",
                "How is the project structured?",
                "Explain the main data flow",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setQuestion(suggestion)}
                  className="rounded-full border border-[var(--color-border)] px-4 py-1.5 text-sm text-[var(--color-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={msg.role === "user" ? "self-end" : "self-start"}
          >
            <FadeIn>
              <div
                className={`max-w-xl rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-[var(--color-accent)] text-[var(--color-bg)]"
                    : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)]"
                }`}
              >
                <MessageContent content={msg.content} />
              </div>

              {msg.relatedFiles.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {msg.relatedFiles.map((file) => (
                    <span
                      key={file}
                      className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 font-mono text-xs text-[var(--color-muted)]"
                    >
                      {file}
                    </span>
                  ))}
                </div>
              )}
            </FadeIn>
          </div>
        ))}

        {asking && (
          <ThinkingSteps
            steps={[
              "Searching the codebase…",
              "Reading relevant files…",
              "Drafting an answer…",
            ]}
          />
        )}
        <div ref={bottomRef} />
      </main>

      <footer className="border-t border-[var(--color-border)] px-6 py-4">
        <div className="mx-auto flex max-w-3xl gap-2">
          <input
            className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[15px] text-[var(--color-fg)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none"
            placeholder="Ask about this codebase…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          />
          <button
            onClick={handleAsk}
            disabled={asking || !question.trim()}
            className="rounded-xl bg-[var(--color-accent)] px-5 py-3 font-medium text-[var(--color-bg)] transition-opacity disabled:opacity-40"
          >
            Ask
          </button>
        </div>
      </footer>
    </div>
  );
}
