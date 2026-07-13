import { useState, useRef, useEffect } from "react";
import { useLoaderData } from "react-router";
import { prisma } from "~/lib/db.server";
import type { Route } from "./+types/app.$appId";
import ReactMarkdown from "react-markdown";

export async function loader({ params }: Route.LoaderArgs) {
  const app = await prisma.app.findUnique({
    where: { id: params.appId },
  });

  if (!app) {
    throw new Response("App not found", { status: 404 });
  }

  return { app };
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AppPlayer() {
  const { app } = useLoaderData<typeof loader>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!loading) {
      inputRef.current?.focus();
    }
  }, [loading]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: app.id,
          messages: updatedMessages,
        }),
      });

      if (!res.ok) throw new Error("Chat failed");

      const data = await res.json();
      setMessages([...updatedMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([
        ...updatedMessages,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.appName}>{app.name}</h1>
      </div>

      <div style={styles.chatArea}>
        {messages.length === 0 && (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <p style={styles.emptyTitle}>Start a conversation</p>
            <p style={styles.emptyHint}>
              Type a message below to begin chatting with {app.name}.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.messageBubble,
              ...(msg.role === "user" ? styles.userBubble : styles.assistantBubble),
            }}
          >
            <div style={styles.messageRole}>
              {msg.role === "user" ? "You" : app.name}
            </div>
            <div className="markdown-content" style={styles.messageContent}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ ...styles.messageBubble, ...styles.assistantBubble }}>
            <div style={styles.messageRole}>{app.name}</div>
            <div style={styles.typing}>
              <span style={styles.dot}>●</span>
              <span style={{ ...styles.dot, animationDelay: "0.2s" }}>●</span>
              <span style={{ ...styles.dot, animationDelay: "0.4s" }}>●</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div style={styles.inputArea}>
        <div style={styles.inputRow}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            style={styles.textInput}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{
              ...styles.sendBtn,
              opacity: loading || !input.trim() ? 0.5 : 1,
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#f8f8fa",
  },
  header: {
    padding: "16px 24px",
    borderBottom: "1px solid #e5e7eb",
    background: "#ffffff",
  },
  appName: {
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
    color: "#1a1a2e",
  },
  chatArea: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  emptyState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center" as const,
    color: "#6b7280",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#1a1a2e",
    marginBottom: 4,
  },
  emptyHint: {
    fontSize: 14,
    color: "#6b7280",
  },
  messageBubble: {
    maxWidth: "75%",
    padding: "12px 16px",
    borderRadius: 12,
    fontSize: 14,
    lineHeight: 1.6,
  },
  userBubble: {
    alignSelf: "flex-end",
    background: "#6c47ff",
    color: "#ffffff",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    color: "#1a1a2e",
  },
  messageRole: {
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 4,
    opacity: 0.7,
  },
  messageContent: {
    whiteSpace: "pre-wrap" as const,
  },
  typing: {
    display: "flex",
    gap: 4,
  },
  dot: {
    fontSize: 10,
    opacity: 0.4,
    animation: "pulse 1s infinite",
  },
  inputArea: {
    padding: "16px 24px",
    borderTop: "1px solid #e5e7eb",
    background: "#ffffff",
  },
  inputRow: {
    display: "flex",
    gap: 12,
    maxWidth: 640,
    margin: "0 auto",
  },
  textInput: {
    flex: 1,
    padding: "10px 14px",
    fontSize: 14,
    fontFamily: "Inter, -apple-system, sans-serif",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    outline: "none",
    resize: "none" as const,
    lineHeight: 1.5,
  },
  sendBtn: {
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
    background: "#6c47ff",
    color: "#ffffff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontFamily: "Inter, -apple-system, sans-serif",
  },
};