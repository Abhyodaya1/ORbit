"use client";

import { useState, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { Send } from "lucide-react";

export interface ChatMessage {
  id: string;
  senderRole: "HOST" | "PEER";
  senderName: string;
  text: string;
  createdAt: string;
}

interface ChatBarProps {
  socket: Socket | null;
  roomCode: string;
  token: string | null;
  role: "HOST" | "PEER" | null;
}

export default function ChatBar({ socket, roomCode, token, role }: ChatBarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Listen for Live Socket Events
  useEffect(() => {
    if (!socket) return;

    // Load past messages from PostgreSQL
    socket.on("chat_history", (history: ChatMessage[]) => {
      setMessages(history);
    });

    // Receive incoming message
    socket.on("new_message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("chat_history");
      socket.off("new_message");
    };
  }, [socket]);

  // 2. Auto-scroll to the newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3. Handle Send Message
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !token) return;

    socket.emit("send_message", {
      roomCode,
      token,
      text: inputText,
    });

    setInputText("");
  };

  return (
    <div className="flex flex-col bg-orbit-surface border-2 border-orbit-border rounded-boxy p-3 shadow-arcadeSm gap-2">
      {/* Scrollable Message History */}
      <div className="max-h-24 md:max-h-28 overflow-y-auto flex flex-col gap-1.5 pr-1">
        {messages.length === 0 ? (
          <p className="text-[11px] text-orbit-muted italic py-1">
            No messages yet. Say hi to your partner! 💬
          </p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderRole === role;
            const timeString = new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={msg.id}
                className={`flex items-baseline gap-2 text-xs ${
                  isMe ? "justify-end" : "justify-start"
                }`}
              >
                {!isMe && (
                  <span className="font-pixel text-[9px] text-orbit-muted uppercase">
                    PARTNER:
                  </span>
                )}
                <span
                  className={`px-2.5 py-1 rounded-boxy border font-medium ${
                    isMe
                      ? "bg-orbit-accent text-white border-orbit-border shadow-sm"
                      : "bg-white text-orbit-text border-orbit-borderMuted shadow-sm"
                  }`}
                >
                  {msg.text}
                </span>
                {isMe && (
                  <span className="font-pixel text-[9px] text-orbit-muted uppercase">
                    YOU
                  </span>
                )}
                <span className="text-[9px] text-orbit-muted opacity-80">
                  {timeString}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Row */}
      <form onSubmit={handleSend} className="flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Send a cozy message..."
          className="flex-1 bg-orbit-subsurface border-2 border-orbit-border rounded-boxy px-3 py-1.5 text-xs text-orbit-text focus:outline-none focus:border-orbit-accent font-medium transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="bg-orbit-accent hover:bg-violet-600 disabled:opacity-50 text-white p-2 rounded-boxy border-2 border-orbit-border shadow-arcadeSm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}