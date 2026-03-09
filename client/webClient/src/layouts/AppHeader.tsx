import { Trophy } from "lucide-react";
import logoImage from "@/assets/film.png";

export interface AppHeaderProps {
  onGoHome: () => void;
  onGoRanking: () => void;
}

export function AppHeader({ onGoHome, onGoRanking }: AppHeaderProps) {
  return (
    <header className="w-full h-16 px-6 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div
        className="flex items-center gap-0.5 cursor-pointer"
        onClick={onGoHome}
      >
        <img
          src={logoImage}
          alt="Logo"
          className="h-8 object-contain"
        />
        <h1 className="text-xl font-bold text-gray-900 tracking-tight font-display">
          관상네컷
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onGoRanking}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-gray-50 transition-all font-bold text-gray-900 text-sm shadow-sm hover:shadow-md border border-gray-200"
        >
          <Trophy className="w-4 h-4" />
          모임 랭킹
        </button>
      </div>
    </header>
  );
}
