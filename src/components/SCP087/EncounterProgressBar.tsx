import React from "react";
import { Progress } from "../ui/progress";
import { Button } from "../ui/button";
import { AlertTriangle, X, Clock } from "lucide-react";
import type { Encounter } from "../../store/scp087.types";
import { useGameStore } from "../../store/gameStore";

interface EncounterProgressBarProps {
  encounter: Encounter;
  x: number;
  y: number;
  cellWidth: number;
  cellHeight: number;
}

export const EncounterProgressBar: React.FC<EncounterProgressBarProps> = ({
  encounter,
  x,
  y,
  cellWidth,
  cellHeight
}) => {
  const abortEncounter = useGameStore(state => state.abortEncounter);
  
  if (!encounter.inProgress || !encounter.progressStarted || !encounter.duration) {
    return null;
  }

  const now = Date.now();
  const elapsed = now - encounter.progressStarted;
  const progress = Math.min(100, (elapsed / encounter.duration) * 100);
  const remainingTime = Math.max(0, encounter.duration - elapsed);
  const remainingSeconds = Math.ceil(remainingTime / 1000);

  const isRedEncounter = encounter.kind === "087-1";
  const progressColor = isRedEncounter ? "destructive" : "default";
  const bgColor = isRedEncounter ? "bg-red-900/80" : "bg-yellow-900/80";

  return (
    <div 
      className={`absolute z-20 ${bgColor} border rounded-lg p-2 min-w-48 shadow-lg backdrop-blur-sm`}
      style={{ 
        left: x * cellWidth + cellWidth,
        top: y * cellHeight - cellHeight / 2,
        transform: 'translateY(-50%)'
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        {isRedEncounter ? (
          <AlertTriangle className="w-4 h-4 text-red-400" />
        ) : (
          <Clock className="w-4 h-4 text-yellow-400" />
        )}
        <span className="text-xs font-mono text-white">
          {isRedEncounter ? "INVESTIGATING" : "COLLECTING"}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => abortEncounter(encounter.id)}
          className="ml-auto p-1 h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-900/50"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-300">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress 
          value={progress} 
          className="h-2"
          // Custom colors based on encounter type
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>
            {isRedEncounter ? `${encounter.requiredDClass || 2} D-Class` : `${encounter.requiredDClass || 1} D-Class`}
          </span>
          <span>{remainingSeconds}s remaining</span>
        </div>
        {isRedEncounter && (
          <div className="text-xs text-red-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>HIGH CASUALTY RISK</span>
          </div>
        )}
      </div>
    </div>
  );
};