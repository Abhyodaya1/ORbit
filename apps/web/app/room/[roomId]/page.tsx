import VideoTile from "@/components/VideoTile";
import GamePanel from "@/components/GamePanel";
import EmojiRow from "@/components/EmojiRow";
import ChatBar from "@/components/ChatBar";
import { Copy, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface RoomPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params;

  return (
    <main className="h-screen max-h-screen w-full arcade-grid-bg flex flex-col p-2.5 sm:p-4 md:p-6 overflow-hidden">
      
      {/* Top Header Bar */}
      <header className="flex items-center justify-between pb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 bg-orbit-surface border-2 border-orbit-border rounded-boxy shadow-arcadeSm hover:bg-orbit-subsurface transition-colors"
            title="Back to Lobby"
          >
            <ArrowLeft className="w-4 h-4 text-orbit-text" />
          </Link>
          <div className="flex items-center gap-1.5">
            <h1 className="font-pixel text-base font-bold text-orbit-text">
              ORBIT
            </h1>
            <Sparkles className="w-4 h-4 text-orbit-accent" />
          </div>
        </div>

        {/* Room Code Badge & Copy Link Button */}
        <div className="flex items-center gap-2">
          <div className="bg-white border-2 border-orbit-border px-3 py-1 rounded-boxy shadow-arcadeSm flex items-center gap-2">
            <span className="font-pixel text-[10px] text-orbit-muted">ROOM:</span>
            <span className="font-pixel text-xs font-bold text-orbit-accent">
              {roomId}
            </span>
          </div>
          <button
            className="bg-orbit-surface hover:bg-orbit-subsurface border-2 border-orbit-border p-1.5 rounded-boxy shadow-arcadeSm text-orbit-text active:translate-x-[1px] active:translate-y-[1px] transition-all"
            title="Copy Invite Link"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Responsive Grid/Flex Body */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0 mb-3">
        
        {/* Left Column: Stacked Video Tiles (Fluid on mobile, 30% width on desktop) */}
        <section className="w-full lg:w-80 xl:w-96 flex flex-row lg:flex-col gap-3 flex-shrink-0 min-h-0">
          <VideoTile label="HOST (YOU)" isLocal={true} status="connected" />
          <VideoTile label="PEER (WAITING)" isLocal={false} status="connecting" />
        </section>

        {/* Right Column: Arcade Game Arena (flex-1 fills all remaining space) */}
        <section className="flex-1 flex flex-col min-h-0">
          <GamePanel />
        </section>
      </div>

      {/* Bottom Full-Width Bar: Emoji Strip + Chat Bar */}
      <footer className="w-full flex flex-col gap-2 flex-shrink-0">
        <EmojiRow />
        <ChatBar />
      </footer>
    </main>
  );
}