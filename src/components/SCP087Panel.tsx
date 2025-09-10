import { useGameStore } from "@/store/gameStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, Shield, Users, Flashlight, Battery, Radio, Network, GraduationCap, ShieldCheck, Zap, Search, Settings, Brain } from "lucide-react";
import { useState, useEffect } from "react";
import { EnhancedStairwellVisualization } from "./SCP087/EnhancedStairwellVisualization";
import { SimpleUpgradeCard } from "./SCP087/SimpleUpgradeCard";
import { OneTimeUpgradeIcon } from "./SCP087/OneTimeUpgradeIcon";
import EnhancedStairwellTerminal from "./SCP087/EnhancedStairwellTerminal";
import { ErrorBoundary } from "./ErrorBoundary";

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

  // Check if upgrade is unlocked
  const isUpgradeUnlocked = (upgrade: any) => {
    if (!upgrade.unlockCondition) return true;
    
    const requiredUpgrade = scp087.upgrades[upgrade.unlockCondition.upgradeId];
    return requiredUpgrade && requiredUpgrade.owned >= upgrade.unlockCondition.level;
  };

  // Filter upgrades: only show unlocked ones
  const getUnlockedUpgrades = (tier: string) => {
    return Object.entries(scp087.upgrades)
      .filter(([_, upgrade]) => (upgrade as any).tier === tier)
      .filter(([_, upgrade]) => isUpgradeUnlocked(upgrade))
      .filter(([_, upgrade]) => {
        const maxLevel = (upgrade as any).maxLevel;
        // For recurring upgrades (no maxLevel or maxLevel > 1), always show
        if (!maxLevel || maxLevel > 1) return true;
        // For one-time upgrades, only show if not purchased
        return upgrade.owned < maxLevel;
      });
  };

  // Get one-time upgrades that are unlocked but not purchased
  const getOneTimeUpgrades = () => {
    return Object.entries(scp087.upgrades)
      .filter(([_, upgrade]) => (upgrade as any).maxLevel === 1)
      .filter(([_, upgrade]) => isUpgradeUnlocked(upgrade))
      .filter(([_, upgrade]) => upgrade.owned === 0);
  };

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
        <ErrorBoundary>
          <EnhancedStairwellTerminal />
        </ErrorBoundary>

        {/* One-time Upgrades */}
        {getOneTimeUpgrades().length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-6 bg-yellow-600 rounded"></div>
              <h4 className="text-sm font-bold text-foreground tracking-wider">SPECIAL UPGRADES</h4>
              <div className="flex-1 h-px bg-gradient-to-r from-yellow-600/50 to-transparent"></div>
            </div>
            <div className="flex gap-2 flex-wrap p-3 bg-muted/10 rounded-lg border border-muted/20">
              {getOneTimeUpgrades().map(([id, upgrade]) => (
                <OneTimeUpgradeIcon
                  key={id}
                  upgrade={upgrade}
                  icon={getIcon(id)}
                  canAfford={scp087.paranoiaEnergy >= upgrade.cost}
                  onPurchase={() => purchaseSCP087Upgrade(id)}
                  formatCurrency={formatNumber}
                />
              ))}
              {getOneTimeUpgrades().length === 0 && (
                <div className="text-xs text-muted-foreground text-center w-full py-2">
                  No special upgrades available
                </div>
              )}
            </div>
          </div>
        )}

        {/* Regular Upgrades */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-red-600 rounded"></div>
            <h4 className="text-sm font-bold text-foreground tracking-wider">UPGRADES</h4>
            <div className="flex-1 h-px bg-gradient-to-r from-red-600/50 to-transparent"></div>
          </div>
          
          {/* Equipment Tier */}
          {getUnlockedUpgrades('equipment').length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-amber-400 font-mono">
                <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
                EQUIPMENT
              </div>
              <div className="grid gap-2">
                {getUnlockedUpgrades('equipment').map(([id, upgrade]) => (
                  <SimpleUpgradeCard
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
          )}

          {/* Personnel Tier */}
          {getUnlockedUpgrades('personnel').length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-blue-400 font-mono">
                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                PERSONNEL
              </div>
              <div className="grid gap-2">
                {getUnlockedUpgrades('personnel').map(([id, upgrade]) => (
                  <SimpleUpgradeCard
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
          )}

          {/* Research Tier */}
          {getUnlockedUpgrades('research').length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-purple-400 font-mono">
                <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                RESEARCH
              </div>
              <div className="grid gap-2">
                {getUnlockedUpgrades('research').map(([id, upgrade]) => (
                  <SimpleUpgradeCard
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
          )}

          {/* Facility Tier */}
          {getUnlockedUpgrades('facility').length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-red-400 font-mono">
                <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                FACILITY
              </div>
              <div className="grid gap-2">
                {getUnlockedUpgrades('facility').map(([id, upgrade]) => (
                  <SimpleUpgradeCard
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
          )}
        </div>
      </CardContent>
    </Card>
  );
};