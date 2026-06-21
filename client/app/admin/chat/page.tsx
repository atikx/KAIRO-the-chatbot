"use client";

import { useRef, useEffect, KeyboardEvent, Suspense } from "react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { resolveQuery, getErrorMessage } from "../../lib/api";
import { useChatStore } from "../../store/chatStore";

export const dynamic = "force-static";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function ChatContent() {
  const { chatId, messages, addMessage, clearMessages } = useChatStore();
  const [input, setInput] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: (text: string) => resolveQuery(text, chatId),
    onSuccess: (data) => {
      addMessage({
        id: uid(),
        role: "assistant",
        content: data.answer || "No answer returned.",
      });
    },
  });

  const send = () => {
    const text = input.trim();
    if (!text || isPending) return;
    addMessage({ id: uid(), role: "user", content: text });
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "42px";
    mutate(text);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleTextareaInput = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "42px";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  };

  const errorMessage = isError ? getErrorMessage(error) : null;

  return (
    <>
      <div className="page-header">
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h1 className="page-title">Test Chat</h1>
            <p className="page-subtitle">
              Query your RAG knowledge base live. Messages persist while this
              tab is open.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              paddingTop: 4,
            }}
          >
            <div className="chat-id-display">
              <span>💬</span>
              <span>Session: {chatId}</span>
            </div>
            {messages.length > 0 && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={clearMessages}
              >
                New Chat
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        className="page-body"
        style={{ display: "flex", flexDirection: "column" }}
      >
        <div className="chat-container">
          {/* Messages */}
          <div className="chat-messages">
            {messages.length === 0 && !isPending ? (
              <div className="chat-empty">
                <div className="chat-empty-icon">◎</div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 650,
                    color: "var(--text-secondary)",
                  }}
                >
                  Start a conversation
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    textAlign: "center",
                    maxWidth: 300,
                    lineHeight: 1.7,
                  }}
                >
                  Ask anything about the content in your knowledge base.
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div key={msg.id} className={`chat-message ${msg.role}`}>
                    <div
                      className={`chat-avatar ${msg.role === "user" ? "user-avatar" : "ai-avatar"}`}
                    >
                      {msg.role === "user" ? "A" : "⚡"}
                    </div>
                    <div className="chat-bubble">
                      {msg.content.split("\n").map((line, i, arr) => (
                        <span key={i}>
                          {line}
                          {i < arr.length - 1 && <br />}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                {isPending && (
                  <div className="chat-message assistant">
                    <div className="chat-avatar ai-avatar">⚡</div>
                    <div className="chat-bubble">
                      <div className="thinking-dots">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                )}

                {isError && errorMessage && (
                  <div className="chat-message assistant">
                    <div
                      className="chat-avatar"
                      style={{
                        background: "var(--error-dim)",
                        border: "1px solid rgba(220,38,38,.3)",
                        fontSize: 14,
                      }}
                    >
                      ⚠
                    </div>
                    <div
                      className="chat-bubble"
                      style={{
                        background: "var(--error-dim)",
                        border: "1px solid rgba(220,38,38,.25)",
                        borderRadius:
                          "4px var(--radius-md) var(--radius-md) var(--radius-md)",
                        color: "var(--error)",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          marginBottom: 4,
                          fontSize: 13,
                        }}
                      >
                        Failed to get a response
                      </div>
                      <div style={{ fontSize: 13, opacity: 0.85 }}>
                        {errorMessage}
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: 12 }}
                          onClick={() => {
                            const lastUser = [...messages]
                              .reverse()
                              .find((m) => m.role === "user");
                            if (lastUser) mutate(lastUser.content);
                          }}
                        >
                          ↺ Retry
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="chat-input-area">
            <textarea
              ref={textareaRef}
              id="chat-input"
              className="chat-input"
              placeholder="Ask a question… (Enter to send, Shift+Enter for new line)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleTextareaInput}
              disabled={isPending}
              rows={1}
            />
            <button
              id="chat-send-btn"
              className="chat-send-btn"
              onClick={send}
              disabled={isPending || !input.trim()}
              title="Send message"
            >
              {isPending ? (
                <span
                  className="spinner"
                  style={{
                    borderColor: "rgba(255,255,255,0.3)",
                    borderTopColor: "white",
                    width: 17,
                    height: 17,
                  }}
                />
              ) : (
                "↑"
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginTop: 12,
            padding: "9px 14px",
            background: "var(--bg-card)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Sending to
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: "var(--accent)",
            }}
          >
            POST {process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4242"}
            /resolveQuery
          </span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            · {messages.length} message{messages.length !== 1 ? "s" : ""} in
            session · History kept on server.
          </span>
        </div>
      </div>
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 40, color: "var(--text-muted)" }}>Loading…</div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
