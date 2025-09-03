import { useGameStore } from "@/store/gameStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, Shield, Users, Flashlight } from "lucide-react";
import { useState, useEffect } from "react";
import { EnhancedStairwellVisualization } from "./SCP087/EnhancedStairwellVisualization";
import { UpgradeCard } from "./SCP087/UpgradeCard";
import StairwellMonitorV21 from "./SCP087/StairwellMonitorV21";

export const SCP087Panel = () => {
  const { 
    scp087, 
    descendStairwell, 
    purchaseSCP087Upgrade 
  } = useGameStore();
  
  const [recentEncounter, setRecentEncounter] = useState(false);
  const [isDescending, setIsDescending] = useState(false);

  useEffect(() => {
    if (Date.now() - scp087.lastEncounter < 3000) {
      setRecentEncounter(true);
      const timer = setTimeout(() => setRecentEncounter(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [scp087.lastEncounter]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return Math.floor(num).toString();
  };

  const getIcon = (upgradeId: string) => {
    switch (upgradeId) {
      case 'flashlight': return Flashlight;
      case 'training': return Shield;
      case 'rope': return TrendingDown;
      case 'team': return Users;
      default: return TrendingDown;
    }
  };

  const handleDescend = () => {
    setIsDescending(true);
    descendStairwell();
    setTimeout(() => setIsDescending(false), 1000);
  };

  return (
    <Card className="facility-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="scp-classification">
            EUCLID
          </Badge>
          <CardTitle className="text-scp-087">SCP-087 - The Stairwell</CardTitle>
        </div>
        {recentEncounter && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertTriangle className="w-4 h-4" />
            SCP-087-1 Encounter Detected
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Terminal v2.1 Stairwell Monitor */}
        <StairwellMonitorV21 />

        {/* Resources */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/50 p-3 rounded">
            <div className="text-sm text-muted-foreground">Paranoia Energy</div>
            <div className="text-2xl font-mono text-scp-087">
              {formatNumber(scp087.paranoiaEnergy)}
            </div>
          </div>
          <div className="bg-muted/50 p-3 rounded">
            <div className="text-sm text-muted-foreground">Current Depth</div>
            <div className="text-2xl font-mono text-foreground">
              {formatNumber(scp087.currentDepth)}
            </div>
          </div>
        </div>

        {/* Auto Progress Indicator */}
        {scp087.autoDescend && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Exploration Team Active</div>
            <Progress value={((Date.now() % 5000) / 5000) * 100} className="h-2" />
          </div>
        )}

        {/* Action Button */}
        <Button 
          onClick={handleDescend}
          className="w-full bg-scp-087 hover:bg-scp-087/80 text-black font-mono"
          disabled={recentEncounter}
        >
          {recentEncounter ? "Recovering from Encounter..." : "DESCEND STAIRWELL"}
        </Button>

        {/* Upgrades */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">CONTAINMENT PROTOCOLS</h4>
          <div className="grid gap-3">
            {Object.entries(scp087.upgrades).map(([id, upgrade]) => (
              <UpgradeCard
                key={id}
                upgrade={upgrade}
                icon={getIcon(id)}
                canAfford={scp087.paranoiaEnergy >= upgrade.cost}
                onPurchase={() => purchaseSCP087Upgrade(id)}
                formatCurrency={formatNumber}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};