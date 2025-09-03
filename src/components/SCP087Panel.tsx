import { useGameStore } from "@/store/gameStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, Shield, Users, Flashlight, Battery, Radio, Network, GraduationCap, ShieldCheck, Zap, Search, Settings, Brain } from "lucide-react";
import { useState, useEffect } from "react";
import { EnhancedStairwellVisualization } from "./SCP087/EnhancedStairwellVisualization";
import { UpgradeCard } from "./SCP087/UpgradeCard";
import EnhancedStairwellTerminal from "./SCP087/EnhancedStairwellTerminal";

export const SCP087Panel = () => {
  const { 
    scp087, 
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
      // Advanced Equipment
      case 'advancedBattery': return Battery;
      case 'emergencyBeacon': return Radio;
      case 'communicationArray': return Network;
      
      // Personnel Enhancement Programs  
      case 'crossTraining': return GraduationCap;
      case 'safetyProtocols': return ShieldCheck;
      case 'experienceAccelerator': return Zap;
      
      // Facility Research Projects
      case 'scpAnalysis': return Search;
      case 'containmentOptimization': return Settings;
      case 'psychologyResearch': return Brain;
      
      // Legacy fallbacks (should not be needed)
      case 'flashlight': return Flashlight;
      case 'training': return Shield;
      case 'rope': return TrendingDown;
      case 'team': return Users;
      default: return TrendingDown;
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
        {/* Enhanced Terminal with Integrated Controls */}
        <EnhancedStairwellTerminal />

        {/* Upgrades */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-6 bg-red-600 rounded"></div>
            <h4 className="text-sm font-bold text-foreground tracking-wider">RESEARCH & DEVELOPMENT</h4>
            <div className="flex-1 h-px bg-gradient-to-r from-red-600/50 to-transparent"></div>
            <div className="text-xs text-red-400 font-mono">CLASSIFIED</div>
          </div>
          <div className="grid gap-3 border-l-2 border-red-600/20 pl-4">
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