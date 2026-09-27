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
    <div className="relative flex flex-col bg-gradient-to-br from-[#fff1f7] via-[#fce7f3] to-[#fed7ea] border-2 border-orbit-border rounded-boxy p-3 shadow-arcadeSm gap-2 overflow-hidden">
      {/* Static Retro Pixel Dot Matrix Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#f472b6_1.2px,transparent_1.2px)] [background-size:18px_18px] opacity-30 pointer-events-none" />

      {/* Subtle CRT Scanlines */}
      <div className="absolute inset-0 scanlines opacity-10 pointer-events-none" />

      {/* Scrollable Message History */}
      <div className="relative z-10 max-h-24 md:max-h-28 overflow-y-auto flex flex-col gap-1.5 pr-1">
        {messages.length === 0 ? (
          <div className="flex items-center gap-1.5 py-1 px-2.5 bg-white/75 backdrop-blur-sm rounded-boxy border border-orbit-borderMuted w-fit shadow-sm">
            <span className="text-xs">💬</span>
            <p className="text-[11px] text-orbit-muted font-medium italic">
              No messages yet. Say hi to your partner!
            </p>
          </div>
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
                  <span className="font-pixel text-[9px] text-orbit-text font-bold uppercase drop-shadow-sm">
                    PARTNER:
                  </span>
                )}
                <span
                  className={`px-3 py-1 rounded-boxy border-2 font-medium max-w-[80%] break-words ${
                    isMe
                      ? "bg-orbit-accent text-white border-orbit-border shadow-arcadeSm"
                      : "bg-white text-orbit-text border-orbit-border shadow-arcadeSm"
                  }`}
                >
                  {msg.text}
                </span>
                {isMe && (
                  <span className="font-pixel text-[9px] text-orbit-text font-bold uppercase drop-shadow-sm">
                    YOU
                  </span>
                )}
                <span className="text-[9px] text-orbit-muted opacity-80 font-mono">
                  {timeString}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Row */}
      <form onSubmit={handleSend} className="relative z-10 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Send a cozy message..."
          className="flex-1 bg-white/95 border-2 border-orbit-border rounded-boxy px-3 py-1.5 text-xs text-orbit-text placeholder:text-orbit-muted focus:outline-none focus:ring-2 focus:ring-orbit-accent/40 font-medium transition-colors shadow-inner"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="bg-orbit-accent hover:bg-violet-600 disabled:opacity-50 text-white p-2 rounded-boxy border-2 border-orbit-border shadow-arcadeSm hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex-shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}