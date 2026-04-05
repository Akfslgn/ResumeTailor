"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Wand2 } from "lucide-react";
import { Resume } from "@/types/resume";
import { toast } from "react-hot-toast";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const EDIT_SUGGESTIONS = [
  "Make the summary shorter",
  "Make the tone more formal",
  "Emphasize leadership experience",
  "Highlight frontend skills more",
];

const CREATE_SUGGESTIONS = [
  "I'm a frontend developer with 3 years of React experience",
  "Help me build a resume from scratch",
  "I just graduated in Computer Science",
];

interface Props {
  resume: Resume | null;
  onResumeUpdate: (updated: Resume) => void;
}

export default function ResumeChatPanel({ resume, onResumeUpdate }: Props) {
  const isCreationMode = !resume;

  const creationGreeting =
    "Hi! I can help you build a resume from scratch. Tell me about yourself — your name, job title, skills, work experience, and education. You can share as much or as little as you want and we'll build it together.";
  const editGreeting =
    "Hi! I can help you refine your resume. Try asking me to shorten the summary, reorder skills, rephrase bullet points, or anything else you'd like to tweak.";

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: isCreationMode ? creationGreeting : editGreeting },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      { role: "assistant", content: isCreationMode ? creationGreeting : editGreeting },
    ]);
    setInput("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreationMode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.slice(1),
          resume: resume ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get response.");

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
      if (data.resume) {
        onResumeUpdate(data.resume);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(msg);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, something went wrong: ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const suggestions = isCreationMode ? CREATE_SUGGESTIONS : EDIT_SUGGESTIONS;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 mb-2">
        {isCreationMode ? (
          <Wand2 size={14} className="text-purple-400" />
        ) : (
          <Bot size={14} className="text-purple-400" />
        )}
        <span className="text-xs font-semibold text-slate-300">
          {isCreationMode ? "Build with AI Chat" : "Refine with AI Chat"}
        </span>
        {!isCreationMode && (
          <span className="text-xs text-slate-500">— tweaks the Tailored tab</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 mb-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                msg.role === "user" ? "bg-blue-600" : "bg-purple-600"
              }`}
            >
              {msg.role === "user" ? <User size={11} /> : <Bot size={11} />}
            </div>
            <div
              className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-slate-700 text-slate-200 rounded-tl-none"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
              <Bot size={11} />
            </div>
            <div className="bg-slate-700 rounded-xl rounded-tl-none px-3 py-2">
              <Loader2 size={13} className="animate-spin text-slate-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions */}
      {messages.length === 1 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2.5 py-1 rounded-full transition-colors border border-slate-600"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 items-end">
        <textarea
          rows={2}
          className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all leading-relaxed"
          placeholder={
            isCreationMode
              ? "Tell me about your background… (Enter to send)"
              : "e.g. Make the summary more concise… (Enter to send)"
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}
