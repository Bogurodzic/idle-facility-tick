import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface StairwellVisualizationProps {
  currentDepth: number;
  isDescending?: boolean;
  encounterActive?: boolean;
}

export const StairwellVisualization = ({ 
  currentDepth, 
  isDescending = false,
  encounterActive = false 
}: StairwellVisualizationProps) => {
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    if (!isDescending) return;
    
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 4);
    }, 200);

    return () => clearInterval(interval);
  }, [isDescending]);

  // Generate stairwell ASCII based on depth
  const generateStairwell = () => {
    const steps = Math.min(8, Math.max(3, Math.floor(currentDepth / 10) + 3));
    const stairwell: string[] = [];
    
    // Top of stairwell
    stairwell.push("┌─────────────┐");
    stairwell.push("│    ENTRY    │");
    stairwell.push("└──┬───────┬──┘");
    
    // Generate steps
    for (let i = 0; i < steps; i++) {
      const isPlayerStep = isDescending && i === (animationStep % steps);
      const stepDepth = i * Math.max(1, Math.floor(currentDepth / steps));
      
      if (i % 2 === 0) {
        // Left-leaning step
        stairwell.push(`   │ ${isPlayerStep ? '●' : ' '} ┌─┴─┐`);
        stairwell.push(`   │   │ ${stepDepth.toString().padStart(3, '0')} │`);
        stairwell.push(`   │   └─┬─┘`);
      } else {
        // Right-leaning step
        stairwell.push(`   └─┐ ${isPlayerStep ? '●' : ' '} │`);
        stairwell.push(`     │ ${stepDepth.toString().padStart(3, '0')} │`);
        stairwell.push(`     └─┬─┘`);
      }
    }
    
    // Bottom with depth indicator
    stairwell.push("       │");
    stairwell.push(`      ${encounterActive ? '👁' : '?'}`);
    stairwell.push(`   DEPTH: ${currentDepth}`);
    
    return stairwell;
  };

  const stairwellLines = generateStairwell();

  return (
    <div className={cn(
      "font-mono text-xs leading-tight transition-all duration-300",
      "bg-muted/20 p-4 rounded-lg border",
      encounterActive && "border-destructive bg-destructive/10 animate-pulse"
    )}>
      <div className="text-center mb-2">
        <div className="text-scp-087 font-semibold">SCP-087 STAIRWELL</div>
        <div className="text-xs text-muted-foreground">
          {isDescending ? "DESCENDING..." : encounterActive ? "ENCOUNTER DETECTED" : "READY"}
        </div>
      </div>
      
      <div className={cn(
        "text-center whitespace-pre transition-transform duration-200",
        isDescending && "animate-pulse",
        encounterActive ? "text-destructive" : "text-foreground"
      )}>
        {stairwellLines.map((line, i) => (
          <div key={i} className={cn(
            "transition-colors duration-200",
            encounterActive && i >= stairwellLines.length - 3 && "text-destructive animate-pulse"
          )}>
            {line}
          </div>
        ))}
      </div>
      
      {currentDepth > 50 && (
        <div className="text-center mt-2 text-xs text-scp-087/70">
          The darkness deepens...
        </div>
      )}
      
      {currentDepth > 200 && (
        <div className="text-center mt-1 text-xs text-destructive/70">
          Something watches from below
        </div>
      )}
    </div>
  );
};