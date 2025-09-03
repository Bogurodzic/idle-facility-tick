import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Upgrade } from "@/store/gameStore";
import { LucideIcon } from "lucide-react";
import { useState, useEffect, useMemo, memo } from "react";

interface UpgradeCardProps {
  upgrade: Upgrade;
  icon: LucideIcon;
  canAfford: boolean;
  onPurchase: () => void;
  formatCurrency: (num: number) => string;
}

const UpgradeCardComponent = ({ 
  upgrade, 
  icon: Icon, 
  canAfford, 
  onPurchase, 
  formatCurrency 
}: UpgradeCardProps) => {
  const [justPurchased, setJustPurchased] = useState(false);
  
  useEffect(() => {
    if (justPurchased) {
      const timer = setTimeout(() => setJustPurchased(false), 600);
      return () => clearTimeout(timer);
    }
  }, [justPurchased]);

  const handlePurchase = () => {
    if (canAfford) {
      setJustPurchased(true);
      onPurchase();
    }
  };

  // Calculate visual evolution based on upgrade level
  const getUpgradeVisuals = () => {
    const level = upgrade.owned;
    
    switch (upgrade.id) {
      case 'advancedBattery':
        return {
          bgClass: level === 0 ? "bg-muted/30" : 
                  level < 5 ? "bg-gradient-to-br from-orange-900/20 to-red-900/20" :
                  level < 10 ? "bg-gradient-to-br from-orange-800/30 to-red-800/30" :
                  level < 15 ? "bg-gradient-to-br from-orange-700/40 to-red-700/40" :
                  "bg-gradient-to-br from-orange-600/50 to-red-600/50",
          borderClass: level === 0 ? "border-muted" :
                      level < 5 ? "border-orange-700/30" :
                      level < 10 ? "border-orange-600/50" :
                      level < 15 ? "border-orange-500/70" :
                      "border-orange-400/90 shadow-lg shadow-orange-500/20",
          iconColor: level === 0 ? "text-muted-foreground" :
                    level < 5 ? "text-orange-400" :
                    level < 10 ? "text-orange-300" :
                    level < 15 ? "text-orange-200" :
                    "text-orange-100",
          effect: level >= 10 ? "animate-pulse" : ""
        };
        
      case 'training':
        return {
          bgClass: level === 0 ? "bg-muted/30" :
                  level < 3 ? "bg-gradient-to-br from-blue-500/20 to-cyan-600/20" :
                  level < 6 ? "bg-gradient-to-br from-blue-400/30 to-cyan-500/30" :
                  "bg-gradient-to-br from-blue-300/40 to-cyan-400/40",
          borderClass: level === 0 ? "border-muted" :
                      level < 3 ? "border-blue-500/30" :
                      level < 6 ? "border-blue-400/50" :
                      "border-blue-300/70 shadow-lg shadow-blue-500/20",
          iconColor: level === 0 ? "text-muted-foreground" :
                    level < 3 ? "text-blue-600" :
                    level < 6 ? "text-blue-500" :
                    "text-blue-400 drop-shadow-glow",
          effect: level >= 5 ? "animate-pulse" : ""
        };
        
      case 'rope':
        return {
          bgClass: level === 0 ? "bg-muted/30" :
                  level < 3 ? "bg-gradient-to-br from-green-500/20 to-emerald-600/20" :
                  level < 6 ? "bg-gradient-to-br from-green-400/30 to-emerald-500/30" :
                  "bg-gradient-to-br from-green-300/40 to-emerald-400/40",
          borderClass: level === 0 ? "border-muted" :
                      level < 3 ? "border-green-500/30" :
                      level < 6 ? "border-green-400/50" :
                      "border-green-300/70 shadow-lg shadow-green-500/20",
          iconColor: level === 0 ? "text-muted-foreground" :
                    level < 3 ? "text-green-600" :
                    level < 6 ? "text-green-500" :
                    "text-green-400 drop-shadow-glow",
          effect: ""
        };
        
      case 'team':
        return {
          bgClass: level === 0 ? "bg-muted/30" :
                  "bg-gradient-to-br from-scp-087/30 to-primary/20",
          borderClass: level === 0 ? "border-muted" :
                      "border-scp-087/50 shadow-lg shadow-scp-087/30",
          iconColor: level === 0 ? "text-muted-foreground" :
                    "text-scp-087 drop-shadow-glow",
          effect: level > 0 ? "animate-pulse" : ""
        };
        
      default:
        // Enhanced SCP-themed styling for all other upgrades
        return {
          bgClass: level === 0 ? "bg-muted/30" : 
                  level < 3 ? "bg-gradient-to-br from-slate-800/20 to-slate-700/20" :
                  level < 6 ? "bg-gradient-to-br from-slate-700/30 to-slate-600/30" :
                  "bg-gradient-to-br from-slate-600/40 to-slate-500/40",
          borderClass: level === 0 ? "border-muted" :
                      level < 3 ? "border-slate-600/30" :
                      level < 6 ? "border-slate-500/50" :
                      "border-slate-400/70 shadow-lg shadow-slate-500/20",
          iconColor: level === 0 ? "text-muted-foreground" :
                    level < 3 ? "text-slate-400" :
                    level < 6 ? "text-slate-300" :
                    "text-slate-200",
          effect: level >= 5 ? "animate-pulse" : ""
        };
    }
  };

  const visuals = useMemo(() => getUpgradeVisuals(), [upgrade.id, upgrade.owned]);

  // Enhanced description with detailed bonuses and tier information
  const getEnhancedDescription = () => {
    const baseUpgrade = upgrade as any; // Type assertion for the enhanced upgrade system
    const tier = baseUpgrade.tier || 'unknown';
    const milestones = baseUpgrade.milestones || [];
    const synergyWith = baseUpgrade.synergyWith || [];
    const unlockCondition = baseUpgrade.unlockCondition;
    const maxLevel = baseUpgrade.maxLevel;
    
    let description = upgrade.description;
    
    // Add current bonuses for owned upgrades
    if (upgrade.owned > 0) {
      description += `\n\nCurrent Status: Level ${upgrade.owned}`;
      
      // Specific upgrade bonuses
      if (upgrade.id === 'advancedBattery') {
        const currentBonus = upgrade.owned;
        const nextBonus = currentBonus + 1;
        const efficiency = Math.round((1 - Math.pow(0.99, currentBonus)) * 100);
        description += `\n• Battery Efficiency: +${currentBonus}%\n• Power Consumption: -${efficiency}%`;
        if (!maxLevel || upgrade.owned < maxLevel) {
          description += `\n• Next Level: +${nextBonus}% efficiency`;
        }
      } else if (upgrade.id === 'tacticalModules') {
        description += `\n• Beam Enhancement: +${upgrade.owned * 15}%`;
        description += `\n• Synergy Bonus: +${upgrade.owned * 5}% to battery efficiency`;
      } else if (upgrade.id === 'crossTraining') {
        description += `\n• Personnel Efficiency: +${upgrade.owned * 15}%`;
      } else if (upgrade.id === 'scpAnalysis') {
        description += `\n• PE Yield Bonus: +${upgrade.owned * 20}%`;
      }
      
      // Show max level indicator
      if (maxLevel) {
        description += `\n• Progress: ${upgrade.owned}/${maxLevel} levels`;
      }
    }
    
    // Add tier information
    const tierColors = {
      equipment: 'Equipment (Frequent)',
      personnel: 'Personnel (Training)', 
      research: 'Research (Advanced)',
      facility: 'Facility (Integration)'
    };
    description += `\n\n🏷️ Tier: ${tierColors[tier as keyof typeof tierColors] || tier}`;
    
    // Add unlock condition
    if (unlockCondition && upgrade.owned === 0) {
      description += `\n🔒 Requires: ${unlockCondition.upgradeId} Level ${unlockCondition.level}`;
    }
    
    // Add milestone information
    if (milestones.length > 0) {
      const nextMilestone = milestones.find(m => m > upgrade.owned);
      if (nextMilestone) {
        description += `\n⭐ Next Milestone: Level ${nextMilestone}`;
      }
      if (upgrade.owned > 0) {
        const achievedMilestones = milestones.filter(m => m <= upgrade.owned);
        if (achievedMilestones.length > 0) {
          description += `\n✅ Milestones: ${achievedMilestones.join(', ')}`;
        }
      }
    }
    
    // Add synergy information
    if (synergyWith.length > 0) {
      description += `\n🔗 Synergies: ${synergyWith.join(', ')}`;
    }
    
    return description;
  };

  return (
    <div className={cn(
      "relative p-3 rounded-lg border transition-all duration-500",
      visuals.bgClass,
      visuals.borderClass,
      visuals.effect,
      justPurchased && "scale-105 shadow-2xl animate-pulse"
    )}>
      {/* Level indicator */}
      {upgrade.owned > 0 && (
        <Badge 
          className={cn(
            "absolute -top-2 -right-2 text-xs font-bold transition-colors",
            upgrade.owned >= 15 ? "bg-gradient-to-r from-red-600 to-orange-600 text-white border-red-400" :
            upgrade.owned >= 10 ? "bg-gradient-to-r from-orange-600 to-red-600 text-white border-orange-400" :
            upgrade.owned >= 5 ? "bg-gradient-to-r from-orange-700 to-orange-600 text-white border-orange-500" :
            "bg-orange-800 text-orange-200 border-orange-600"
          )}
        >
          L{upgrade.owned}
        </Badge>
      )}
      
      {/* Mastery indicator for high levels */}
      {upgrade.owned >= 15 && (
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-full animate-pulse border border-red-400" />
      )}
      
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded transition-all duration-300",
          visuals.iconColor,
          upgrade.owned > 0 ? "bg-background/50" : "bg-muted/50"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className={cn(
              "font-semibold text-sm transition-colors",
              upgrade.owned > 0 ? "text-foreground" : "text-muted-foreground"
            )}>
              {upgrade.name}
            </h4>
          </div>
          
          <div className="text-xs text-muted-foreground mb-2 whitespace-pre-line">
            {getEnhancedDescription()}
          </div>
          
          {/* Visual effect indicator for certain upgrades */}
          {upgrade.owned > 0 && upgrade.id === 'advancedBattery' && (
            <div className="mb-2">
              <Progress 
                value={Math.min((upgrade.owned / 20) * 100, 100)} 
                className="h-1 bg-muted"
              />
              <div className="text-xs text-muted-foreground mt-1">
                Efficiency Bonus: +{upgrade.owned}% | Next Level: +{upgrade.owned + 1}%
              </div>
            </div>
          )}
          
          <Button
            size="sm"
            variant={canAfford ? "default" : "outline"}
            onClick={handlePurchase}
            disabled={!canAfford || justPurchased}
            className={cn(
              "w-full font-mono text-xs transition-all duration-300",
              !canAfford && "opacity-60",
              justPurchased && "animate-bounce"
            )}
          >
            {justPurchased ? "ACQUIRED!" : `${formatCurrency(upgrade.cost)} PE`}
          </Button>
        </div>
      </div>
      
      {/* Purchase effect overlay */}
      {justPurchased && (
        <div className="absolute inset-0 bg-gradient-to-r from-scp-087/20 to-primary/20 rounded-lg animate-fade-in pointer-events-none" />
      )}
    </div>
  );
};

export const UpgradeCard = memo(UpgradeCardComponent);