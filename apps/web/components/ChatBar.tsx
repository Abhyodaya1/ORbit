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
    <div className="relative flex flex-col bg-gradient-to-br from-[#fff1f7] via-[#fce7f3] to-[#fed7ea] border-[3px] border-orbit-border rounded-boxy p-3 shadow-arcade gap-2 overflow-hidden">
      {/* Static Retro Pixel Dot Matrix Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#f472b6_1.2px,transparent_1.2px)] [background-size:18px_18px] opacity-30 pointer-events-none" />

      {/* Subtle CRT Scanlines */}
      <div className="absolute inset-0 scanlines opacity-10 pointer-events-none" />

      {/* Scrollable Message History */}
      <div className="relative z-10 max-h-24 md:max-h-28 overflow-y-auto flex flex-col gap-1.5 pr-1">
        {messages.length === 0 ? (
          <div className="flex items-center gap-1.5 py-1 px-2.5 bg-white/80 backdrop-blur-sm rounded-boxy border border-orbit-borderMuted w-fit shadow-sm">
            <span className="text-xs">💬</span>
            <p className="text-telemetry font-sans text-orbit-muted font-medium italic">
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
                  <span className="font-pixel text-pixel-tag text-orbit-text font-bold uppercase drop-shadow-sm pt-0.5 leading-none">
                    PARTNER:
                  </span>
                )}
                <span
                  className={`px-3 py-1.5 rounded-boxy border-2 border-orbit-border font-sans font-medium text-xs max-w-[80%] break-words ${
                    isMe
                      ? "bg-orbit-accent text-white shadow-arcadeSm"
                      : "bg-white text-orbit-text shadow-arcadeSm"
                  }`}
                >
                  {msg.text}
                </span>
                {isMe && (
                  <span className="font-pixel text-pixel-tag text-orbit-text font-bold uppercase drop-shadow-sm pt-0.5 leading-none">
                    YOU
                  </span>
                )}
                <span className="text-telemetry text-orbit-muted font-mono leading-none">
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
          className="flex-1 h-10 bg-white border-2 border-orbit-border rounded-boxy px-3 text-xs font-sans text-orbit-text placeholder:text-orbit-muted/60 focus:outline-none focus:ring-2 focus:ring-orbit-accent font-medium transition-colors shadow-inner"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="h-10 w-10 bg-orbit-accent hover:bg-violet-600 active:bg-violet-700 disabled:opacity-40 text-white rounded-boxy border-2 border-orbit-border shadow-arcadeSm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-arcade active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-[transform,box-shadow,background-color] duration-150 flex items-center justify-center flex-shrink-0 cursor-pointer"
          title="Send message"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}