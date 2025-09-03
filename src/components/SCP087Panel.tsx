import { useGameStore } from "@/store/gameStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, Shield, Users } from "lucide-react";
import { useState, useEffect } from "react";

export const SCP087Panel = () => {
  const { 
    scp087, 
    descendStairwell, 
    purchaseSCP087Upgrade 
  } = useGameStore();
  
  const [recentEncounter, setRecentEncounter] = useState(false);

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
      case 'flashlight': return <TrendingDown className="w-4 h-4" />;
      case 'training': return <Shield className="w-4 h-4" />;
      case 'rope': return <TrendingDown className="w-4 h-4" />;
      case 'team': return <Users className="w-4 h-4" />;
      default: return null;
    }
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
          onClick={descendStairwell}
          className="w-full bg-scp-087 hover:bg-scp-087/80 text-black font-mono"
          disabled={recentEncounter}
        >
          {recentEncounter ? "Recovering from Encounter..." : "DESCEND STAIRWELL"}
        </Button>

        {/* Upgrades */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">CONTAINMENT PROTOCOLS</h4>
          <div className="grid gap-2">
            {Object.entries(scp087.upgrades).map(([id, upgrade]) => (
              <div key={id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div className="flex items-center gap-2 flex-1">
                  {getIcon(id)}
                  <div className="flex-1">
                    <div className="text-sm font-medium">{upgrade.name}</div>
                    <div className="text-xs text-muted-foreground">{upgrade.description}</div>
                    {upgrade.owned > 0 && (
                      <div className="text-xs text-scp-087">Level {upgrade.owned}</div>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => purchaseSCP087Upgrade(id)}
                  disabled={scp087.paranoiaEnergy < upgrade.cost}
                  className="font-mono text-xs"
                >
                  {formatNumber(upgrade.cost)} PE
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};