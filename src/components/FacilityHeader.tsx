import { useGameStore } from "@/store/gameStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Brain } from "lucide-react";

export const FacilityHeader = () => {
  const { facility, scp087, scp173, scp999 } = useGameStore();

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return Math.floor(num).toString();
  };

  const getThreatLevel = () => {
    const totalResources = scp087.paranoiaEnergy + scp173.observationPoints + scp999.euphoriaOrbs;
    if (totalResources > 10000) return { level: "KETER", color: "destructive" };
    if (totalResources > 1000) return { level: "EUCLID", color: "default" };
    return { level: "SAFE", color: "secondary" };
  };

  const threat = getThreatLevel();

  return (
    <Card className="facility-panel mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold scp-classification">
                  SITE-19 IDLE FACILITY
                </h1>
                <p className="text-sm text-muted-foreground">
                  Foundation Autonomous Management System
                </p>
              </div>
            </div>
            <Badge variant={threat.color as any} className="scp-classification">
              {threat.level}
            </Badge>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Containment Points</div>
              <div className="text-lg font-mono text-primary">
                {formatNumber(facility.containmentPoints)}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Foundation Knowledge</div>
              <div className="text-lg font-mono text-accent flex items-center gap-1">
                <Brain className="w-4 h-4" />
                {formatNumber(facility.foundationKnowledge)}
              </div>
            </div>
            
            {scp173.breachActive && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                <span className="font-bold scp-classification">BREACH ACTIVE</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Resource Summary Bar */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <div className="text-scp-087 font-mono text-lg">
              {formatNumber(scp087.paranoiaEnergy)}
            </div>
            <div className="text-xs text-muted-foreground">Paranoia Energy</div>
          </div>
          <div className="text-center">
            <div className="text-scp-173 font-mono text-lg">
              {formatNumber(scp173.observationPoints)}
            </div>
            <div className="text-xs text-muted-foreground">Observation Points</div>
          </div>
          <div className="text-center">
            <div className="text-scp-999 font-mono text-lg">
              {formatNumber(scp999.euphoriaOrbs)}
            </div>
            <div className="text-xs text-muted-foreground">Euphoria Orbs</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};