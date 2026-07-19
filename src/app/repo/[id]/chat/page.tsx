"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { MessageContent } from "@/components/chat/MessageContent";
import { ThinkingSteps } from "@/components/chat/ThinkingSteps";

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
    <div className="flex min-h-screen flex-col bg-[#12141C] text-[#EDEAE0]">
      <header className="flex items-center justify-between border-b border-[#262A38] px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-[#8B90A3]">
          <span className="text-[#E8A33D]">◆</span>
          <span>
            You're exploring an unfamiliar codebase — ask anything, no question
            is too basic.
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href={`/repo/${repositoryId}/architecture`}
            className="text-sm text-[#8B90A3] hover:text-[#E8A33D]"
          >
            Architecture map →
          </Link>
          <Link
            href={`/repo/${repositoryId}/root-cause`}
            className="text-sm text-[#8B90A3] hover:text-[#E8A33D]"
          >
            Debug an error →
          </Link>
          <UserButton />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-8">
        {messages.length === 0 && (
          <div className="mt-16 text-center">
            <p className="text-lg text-[#8B90A3]">Where should we start?</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {[
                "Where does the app start running?",
                "How is the project structured?",
                "Explain the main data flow",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setQuestion(suggestion)}
                  className="rounded-full border border-[#262A38] px-4 py-1.5 text-sm text-[#8B90A3] transition-colors hover:border-[#E8A33D] hover:text-[#E8A33D]"
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
            <div
              className={`max-w-xl rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-[#E8A33D] text-[#12141C]"
                  : "border border-[#262A38] bg-[#181B26] text-[#EDEAE0]"
              }`}
            >
              <MessageContent content={msg.content} />
            </div>

            {msg.relatedFiles.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {msg.relatedFiles.map((file) => (
                  <span
                    key={file}
                    className="rounded border border-[#262A38] bg-[#181B26] px-2 py-0.5 font-mono text-xs text-[#8B90A3]"
                  >
                    {file}
                  </span>
                ))}
              </div>
            )}
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

      <footer className="border-t border-[#262A38] px-6 py-4">
        <div className="mx-auto flex max-w-3xl gap-2">
          <input
            className="flex-1 rounded-xl border border-[#262A38] bg-[#181B26] px-4 py-3 text-[15px] text-[#EDEAE0] placeholder:text-[#8B90A3] focus:border-[#E8A33D] focus:outline-none"
            placeholder="Ask about this codebase…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          />
          <button
            onClick={handleAsk}
            disabled={asking || !question.trim()}
            className="rounded-xl bg-[#E8A33D] px-5 py-3 font-medium text-[#12141C] transition-opacity disabled:opacity-40"
          >
            Ask
          </button>
        </div>
      </footer>
    </div>
  );
}
