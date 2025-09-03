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
      // EQUIPMENT TIER
      case 'advancedBattery': return Battery;
      case 'tacticalModules': return Flashlight;
      case 'emergencyCache': return Shield;
      
      // PERSONNEL TIER  
      case 'crossTraining': return GraduationCap;
      case 'psychologyProgram': return Brain;
      case 'eliteRecruitment': return Users;
      case 'experienceAccelerator': return Zap;
      
      // RESEARCH TIER
      case 'scpAnalysis': return Search;
      case 'anomalousPhysics': return TrendingDown;
      case 'containmentBreakthrough': return ShieldCheck;
      
      // FACILITY TIER
      case 'site19Integration': return Network;
      case 'foundationNetwork': return Radio;
      case 'o5Authorization': return Settings;
      
      // Legacy fallbacks (should not be needed)
      case 'emergencyBeacon': return Radio;
      case 'communicationArray': return Network;
      case 'safetyProtocols': return ShieldCheck;
      case 'containmentOptimization': return Settings;
      case 'psychologyResearch': return Brain;
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
            <div className="text-xs text-red-400 font-mono">TIER SYSTEM</div>
          </div>
          
          {/* Equipment Tier */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-mono pl-2">
              <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
              EQUIPMENT TIER - Frequent Upgrades (1.07x scaling)
            </div>
            <div className="grid gap-3 border-l-2 border-amber-600/20 pl-4">
              {Object.entries(scp087.upgrades)
                .filter(([_, upgrade]) => (upgrade as any).tier === 'equipment')
                .map(([id, upgrade]) => (
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

          {/* Personnel Tier */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-blue-400 font-mono pl-2">
              <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
              PERSONNEL TIER - Training Programs (1.15x scaling)
            </div>
            <div className="grid gap-3 border-l-2 border-blue-600/20 pl-4">
              {Object.entries(scp087.upgrades)
                .filter(([_, upgrade]) => (upgrade as any).tier === 'personnel')
                .map(([id, upgrade]) => (
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

          {/* Research Tier */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-purple-400 font-mono pl-2">
              <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
              RESEARCH TIER - Advanced Studies (1.20x scaling)
            </div>
            <div className="grid gap-3 border-l-2 border-purple-600/20 pl-4">
              {Object.entries(scp087.upgrades)
                .filter(([_, upgrade]) => (upgrade as any).tier === 'research')
                .map(([id, upgrade]) => (
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

          {/* Facility Tier */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-red-400 font-mono pl-2">
              <div className="w-1 h-1 bg-red-400 rounded-full"></div>
              FACILITY TIER - Foundation Integration (1.25x scaling)
            </div>
            <div className="grid gap-3 border-l-2 border-red-600/20 pl-4">
              {Object.entries(scp087.upgrades)
                .filter(([_, upgrade]) => (upgrade as any).tier === 'facility')
                .map(([id, upgrade]) => (
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
        </div>
      </CardContent>
    </Card>
  );
};