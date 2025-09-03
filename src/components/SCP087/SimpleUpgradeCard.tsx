import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { Upgrade } from "@/store/gameStore";
import { LucideIcon } from "lucide-react";
import { useState, useEffect, memo } from "react";

interface SimpleUpgradeCardProps {
  upgrade: Upgrade;
  icon: LucideIcon;
  canAfford: boolean;
  onPurchase: () => void;
  formatCurrency: (num: number) => string;
}

const SimpleUpgradeCardComponent = ({ 
  upgrade, 
  icon: Icon, 
  canAfford, 
  onPurchase, 
  formatCurrency 
}: SimpleUpgradeCardProps) => {
  const [justPurchased, setJustPurchased] = useState(false);
  
  useEffect(() => {
    if (justPurchased) {
      const timer = setTimeout(() => setJustPurchased(false), 300);
      return () => clearTimeout(timer);
    }
  }, [justPurchased]);

  const handlePurchase = () => {
    if (canAfford) {
      setJustPurchased(true);
      onPurchase();
    }
  };

  // Get detailed description for hover
  const getDetailedDescription = () => {
    const baseUpgrade = upgrade as any;
    const tier = baseUpgrade.tier || 'unknown';
    const milestones = baseUpgrade.milestones || [];
    const synergyWith = baseUpgrade.synergyWith || [];
    const unlockCondition = baseUpgrade.unlockCondition;
    const maxLevel = baseUpgrade.maxLevel;
    
    let description = upgrade.description;
    
    // Add current bonuses for owned upgrades
    if (upgrade.owned > 0) {
      description += `\n\n• Current Level: ${upgrade.owned}`;
      
      // Specific upgrade bonuses
      if (upgrade.id === 'advancedBattery') {
        const efficiency = Math.round((1 - Math.pow(0.99, upgrade.owned)) * 100);
        description += `\n• Battery Efficiency: +${upgrade.owned}%`;
        description += `\n• Power Reduction: -${efficiency}%`;
      } else if (upgrade.id === 'tacticalModules') {
        description += `\n• Beam Enhancement: +${upgrade.owned * 15}%`;
      } else if (upgrade.id === 'crossTraining') {
        description += `\n• Personnel Efficiency: +${upgrade.owned * 15}%`;
      } else if (upgrade.id === 'scpAnalysis') {
        description += `\n• PE Yield Bonus: +${upgrade.owned * 20}%`;
      }
      
      if (maxLevel) {
        description += `\n• Progress: ${upgrade.owned}/${maxLevel}`;
      }
    }
    
    // Add tier information
    const tierInfo = {
      equipment: 'Equipment Tier (1.07x cost scaling)',
      personnel: 'Personnel Tier (1.15x cost scaling)', 
      research: 'Research Tier (1.20x cost scaling)',
      facility: 'Facility Tier (1.25x cost scaling)'
    };
    description += `\n\n📋 ${tierInfo[tier as keyof typeof tierInfo] || tier}`;
    
    // Add unlock condition
    if (unlockCondition && upgrade.owned === 0) {
      description += `\n🔒 Requires: ${unlockCondition.upgradeId} Level ${unlockCondition.level}`;
    }
    
    // Add milestones
    if (milestones.length > 0) {
      const nextMilestone = milestones.find(m => m > upgrade.owned);
      if (nextMilestone) {
        description += `\n⭐ Next Milestone: Level ${nextMilestone}`;
      }
    }
    
    // Add synergies
    if (synergyWith.length > 0) {
      description += `\n🔗 Synergies: ${synergyWith.join(', ')}`;
    }
    
    return description;
  };

  const getTierColor = () => {
    const tier = (upgrade as any).tier;
    switch (tier) {
      case 'equipment': return 'border-amber-600/30 bg-amber-950/10';
      case 'personnel': return 'border-blue-600/30 bg-blue-950/10';
      case 'research': return 'border-purple-600/30 bg-purple-950/10';
      case 'facility': return 'border-red-600/30 bg-red-950/10';
      default: return 'border-muted bg-muted/5';
    }
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className={cn(
          "relative p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-lg",
          getTierColor(),
          justPurchased && "scale-105 animate-pulse",
          !canAfford && "opacity-60"
        )}>
          {/* Level badge */}
          {upgrade.owned > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -right-2 text-xs font-mono min-w-[24px] h-5"
            >
              {upgrade.owned}
            </Badge>
          )}
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-background/50">
              <Icon className="w-4 h-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm truncate">
                  {upgrade.name}
                </h4>
              </div>
              
              <Button
                size="sm"
                variant={canAfford ? "default" : "outline"}
                onClick={handlePurchase}
                disabled={!canAfford || justPurchased}
                className="w-full font-mono text-xs h-7"
              >
                {justPurchased ? "✓" : formatCurrency(upgrade.cost)}
              </Button>
            </div>
          </div>
        </div>
      </HoverCardTrigger>
      
      <HoverCardContent className="w-80 p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            <h4 className="font-semibold">{upgrade.name}</h4>
            {upgrade.owned > 0 && (
              <Badge variant="secondary" className="text-xs">
                Level {upgrade.owned}
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground whitespace-pre-line">
            {getDetailedDescription()}
          </div>
          <div className="pt-2 border-t">
            <div className="text-xs font-mono">
              Cost: {formatCurrency(upgrade.cost)} PE
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export const SimpleUpgradeCard = memo(SimpleUpgradeCardComponent);