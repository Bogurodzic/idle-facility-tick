import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/gameStore";

interface EnhancedStairwellVisualizationProps {
  currentDepth: number;
  isDescending?: boolean;
  encounterActive?: boolean;
  flashlightBattery: number;
  personnel: Array<{ id: string; position: number; direction: 'down' | 'up' }>;
  activeEncounters: Array<{ id: string; position: number; type: 'hostile' | 'neutral'; symbol: string }>;
}

export const EnhancedStairwellVisualization = ({ 
  currentDepth, 
  isDescending = false,
  encounterActive = false,
  flashlightBattery,
  personnel,
  activeEncounters
}: EnhancedStairwellVisualizationProps) => {
  const [animationStep, setAnimationStep] = useState(0);
  const [scanlines, setScanlines] = useState(true);
  const { rechargeFlashlight } = useGameStore();

  useEffect(() => {
    if (!isDescending) return;
    
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 4);
    }, 150);

    return () => clearInterval(interval);
  }, [isDescending]);

  useEffect(() => {
    // CRT scanline flicker effect
    const interval = setInterval(() => {
      setScanlines(prev => !prev);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Generate enhanced stairwell ASCII
  const generateStairwell = () => {
    const steps = Math.min(8, Math.max(3, Math.floor(currentDepth / 10) + 3));
    const stairwell: string[] = [];
    
    // Terminal header with CRT styling
    stairwell.push("╔═══════════════════════════╗");
    stairwell.push("║   SCP-087 TERMINAL v2.1   ║");
    stairwell.push("║   [CLASSIFIED ACCESS]     ║");
    stairwell.push("╚═══╤═══════════════════╤═══╝");
    
    // Flashlight status bar
    const batteryBars = Math.floor(flashlightBattery / 10);
    const batteryDisplay = "█".repeat(batteryBars) + "░".repeat(10 - batteryBars);
    stairwell.push(`    │ LIGHT: [${batteryDisplay}] │`);
    
    // Light cone visualization (when battery > 0)
    const lightRadius = Math.max(0, Math.floor(flashlightBattery / 25));
    
    // Generate steps with enhanced features
    for (let i = 0; i < steps; i++) {
      const isPlayerStep = isDescending && i === (animationStep % steps);
      const stepDepth = i * Math.max(1, Math.floor(currentDepth / steps));
      
      // Check for entities at this position
      const personnelAtPosition = personnel.filter(p => Math.floor(p.position) === i);
      const encountersAtPosition = activeEncounters.filter(e => Math.floor(e.position) === i);
      
      // Determine visibility based on flashlight range
      const isLit = lightRadius >= Math.abs(i - (animationStep % steps));
      const visibility = flashlightBattery > 0 ? (isLit ? 1.0 : 0.3) : 0.1;
      
      if (i % 2 === 0) {
        // Left-leaning step with entities
        let leftChar = ' ';
        let rightChar = ' ';
        
        if (isPlayerStep) leftChar = '●';
        else if (personnelAtPosition.length > 0) leftChar = '▲';
        else if (encountersAtPosition.length > 0) leftChar = encountersAtPosition[0].symbol;
        
        // Light cone effect
        const lightEffect = isLit && flashlightBattery > 50 ? '◆' : isLit ? '◇' : ' ';
        
        stairwell.push(`    │${leftChar}${lightEffect}┌─┴─┐${rightChar}│ ${visibility < 0.5 ? '░' : '█'}`);
        stairwell.push(`    │   │ ${stepDepth.toString().padStart(3, '0')} │  │`);
        stairwell.push(`    │   └─┬─┘   │`);
      } else {
        // Right-leaning step with entities
        let leftChar = ' ';
        let rightChar = ' ';
        
        if (isPlayerStep) rightChar = '●';
        else if (personnelAtPosition.length > 0) rightChar = '▲';
        else if (encountersAtPosition.length > 0) rightChar = encountersAtPosition[0].symbol;
        
        const lightEffect = isLit && flashlightBattery > 50 ? '◆' : isLit ? '◇' : ' ';
        
        stairwell.push(`    └─┐${leftChar}${lightEffect}${rightChar}│ ${visibility < 0.5 ? '░' : '█'}`);
        stairwell.push(`      │ ${stepDepth.toString().padStart(3, '0')} │  │`);
        stairwell.push(`      └─┬─┘   │`);
      }
    }
    
    // Bottom section with terminal info
    stairwell.push("        │        │");
    stairwell.push(`       ${encounterActive ? '⚠' : activeEncounters.length > 0 ? '◉' : '?'}        │`);
    stairwell.push(`    DEPTH: ${currentDepth}  │`);
    stairwell.push(`    BATT:  ${flashlightBattery.toFixed(0)}%   │`);
    stairwell.push("                 │");
    
    return stairwell;
  };

  const stairwellLines = generateStairwell();
  const lowBattery = flashlightBattery < 20;

  return (
    <div className={cn(
      "relative font-mono text-xs leading-tight transition-all duration-300",
      "bg-black/90 p-4 rounded border-2",
      "border-green-400/50 shadow-lg shadow-green-500/20",
      encounterActive && "border-red-500 bg-red-900/20 animate-pulse",
      lowBattery && "border-yellow-500/70 animate-pulse"
    )}>
      {/* CRT Scanlines Effect */}
      <div className={cn(
        "absolute inset-0 pointer-events-none",
        "bg-gradient-to-b from-transparent via-green-400/5 to-transparent",
        "animate-pulse",
        scanlines && "opacity-100"
      )} 
      style={{
        background: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 1px,
          rgba(0, 255, 0, 0.03) 2px,
          rgba(0, 255, 0, 0.03) 3px
        )`
      }} />
      
      {/* CRT Flicker */}
      <div className={cn(
        "absolute inset-0 bg-green-400/10 pointer-events-none",
        "animate-pulse opacity-20"
      )} />

      {/* Terminal Header */}
      <div className="text-center mb-2">
        <div className={cn(
          "text-green-400 font-bold text-sm tracking-wider",
          encounterActive && "text-red-400 animate-pulse"
        )}>
          ► SCP-087 MONITORING STATION ◄
        </div>
        <div className={cn(
          "text-xs",
          isDescending ? "text-yellow-400 animate-pulse" : 
          encounterActive ? "text-red-400" : 
          lowBattery ? "text-yellow-400" : "text-green-400/70"
        )}>
          {isDescending ? "║ DESCENT IN PROGRESS ║" : 
           encounterActive ? "║ HOSTILE CONTACT ║" : 
           lowBattery ? "║ LOW POWER WARNING ║" : "║ SYSTEM READY ║"}
        </div>
      </div>
      
      {/* ASCII Stairwell */}
      <div className={cn(
        "text-center whitespace-pre transition-all duration-200",
        isDescending && "animate-pulse",
        encounterActive ? "text-red-400" : 
        lowBattery ? "text-yellow-400/80" : "text-green-400",
        flashlightBattery < 10 && "opacity-50"
      )}>
        {stairwellLines.map((line, i) => (
          <div key={i} className={cn(
            "transition-all duration-200 font-mono",
            encounterActive && i >= stairwellLines.length - 5 && "text-red-400 animate-pulse",
            i < 5 && "text-green-300", // Header lines
            flashlightBattery < 30 && i > 5 && "opacity-70"
          )}>
            {line}
          </div>
        ))}
      </div>
      
      {/* Interactive Elements */}
      <div className="flex justify-between items-center mt-3 text-xs">
        <div className={cn(
          "transition-colors",
          lowBattery ? "text-yellow-400" : "text-green-400/70"
        )}>
          PERSONNEL: {personnel.length}/3
        </div>
        
        <button
          onClick={rechargeFlashlight}
          disabled={flashlightBattery > 90}
          className={cn(
            "px-2 py-1 border rounded font-mono text-xs transition-all",
            flashlightBattery > 90 
              ? "border-green-600/30 text-green-600/50 cursor-not-allowed"
              : "border-yellow-400 text-yellow-400 hover:bg-yellow-400/10 active:scale-95"
          )}
        >
          [{flashlightBattery > 90 ? 'CHARGED' : 'RECHARGE'}]
        </button>
        
        <div className={cn(
          "transition-colors",
          activeEncounters.length > 0 ? "text-red-400 animate-pulse" : "text-green-400/70"
        )}>
          CONTACTS: {activeEncounters.length}
        </div>
      </div>

      {/* Status Messages */}
      {currentDepth > 50 && (
        <div className="text-center mt-2 text-xs text-green-400/50 animate-pulse">
          ║ SIGNAL DEGRADATION DETECTED ║
        </div>
      )}
      
      {currentDepth > 200 && (
        <div className="text-center mt-1 text-xs text-red-400/70 animate-pulse">
          ║ ANOMALOUS READINGS ║
        </div>
      )}
      
      {lowBattery && (
        <div className="text-center mt-1 text-xs text-yellow-400 animate-pulse">
          ║ POWER CELL CRITICAL ║
        </div>
      )}
    </div>
  );
};