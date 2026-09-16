"use client";

import { Send } from "lucide-react";
import { useState } from "react";

interface Message {
 id: String;
 sender: 'You' | 'Partner';
 text: String;
 time: String;
}

export default function ChatBar() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "Partner",
      text: "Ready to play?",
      time: "12:00"
    },
    {
      id: "2",
      sender: "You",
      text: "Let's do this! 🕹️",
      time: "12:01"
    }
  ]);
  const [inputText, setInputText] = useState("");
 
  const handleSend =(e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setMessages((prev)=> [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "You",
        text: inputText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
    ])
    setInputText("");
  };

  return (
    <div className=" flex flex-col bg-orbit-surface border-2 border-orbit-border rounded-boxy p-3 shadow-arcadeSm gap-2">
      {/* Scrollable Chat Message History */}
      <div className="max-h-24 md:max-h-28 overflow-y-auto flex flex-col gap-1.5 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-baseline gap-2 text-xs ${
              msg.sender === "You" ? "justify-end" : "justify-start"
            }`}
          >
            <span className="font-pixel text-[10px] text-orbit-muted">
              {msg.sender}:
            </span>
            <span
              className={`px-2.5 py-1 rounded-boxy border border-orbit-border ${
                msg.sender === "You"
                  ? "bg-orbit-accent text-white"
                  : "bg-orbit-subsurface text-orbit-text"
              }`}
            >
              {msg.text}
            </span>
            <span className="text-[9px] text-orbit-muted">{msg.time}</span>
          </div>
        ))}
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
          className="bg-orbit-accent hover:bg-violet-600 text-white p-2 rounded-boxy border-2 border-orbit-border shadow-arcadeSm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}