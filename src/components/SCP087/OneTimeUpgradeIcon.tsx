import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { Upgrade } from "@/store/gameStore";
import { LucideIcon } from "lucide-react";
import { useState, useEffect, memo } from "react";

interface OneTimeUpgradeIconProps {
  upgrade: Upgrade;
  icon: LucideIcon;
  canAfford: boolean;
  onPurchase: () => void;
  formatCurrency: (num: number) => string;
}

const OneTimeUpgradeIconComponent = ({ 
  upgrade, 
  icon: Icon, 
  canAfford, 
  onPurchase, 
  formatCurrency 
}: OneTimeUpgradeIconProps) => {
  const [justPurchased, setJustPurchased] = useState(false);
  
  useEffect(() => {
    if (justPurchased) {
      const timer = setTimeout(() => setJustPurchased(false), 500);
      return () => clearTimeout(timer);
    }
  }, [justPurchased]);

  const handlePurchase = () => {
    if (canAfford) {
      setJustPurchased(true);
      onPurchase();
    }
  };

  // Don't render if already purchased
  if (upgrade.owned >= ((upgrade as any).maxLevel || 1)) {
    return null;
  }

  const getTierColor = () => {
    const tier = (upgrade as any).tier;
    switch (tier) {
      case 'equipment': return 'border-amber-500 bg-amber-500/20 text-amber-300';
      case 'personnel': return 'border-blue-500 bg-blue-500/20 text-blue-300';
      case 'research': return 'border-purple-500 bg-purple-500/20 text-purple-300';
      case 'facility': return 'border-red-500 bg-red-500/20 text-red-300';
      default: return 'border-muted bg-muted/20 text-muted-foreground';
    }
  };

  const getDetailedDescription = () => {
    const baseUpgrade = upgrade as any;
    const unlockCondition = baseUpgrade.unlockCondition;
    
    let description = upgrade.description;
    description += `\n\n🏆 One-time upgrade`;
    description += `\nCost: ${formatCurrency(upgrade.cost)} PE`;
    
    if (unlockCondition) {
      description += `\n🔒 Requires: ${unlockCondition.upgradeId} Level ${unlockCondition.level}`;
    }
    
    return description;
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div 
          onClick={handlePurchase}
          className={cn(
            "relative w-12 h-12 rounded-lg border-2 transition-all duration-200 cursor-pointer",
            "flex items-center justify-center hover:scale-110",
            getTierColor(),
            justPurchased && "animate-bounce",
            !canAfford && "opacity-50 cursor-not-allowed"
          )}
        >
          <Icon className="w-5 h-5" />
          
          {/* Affordable indicator */}
          {canAfford && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          )}
          
          {/* Purchase effect */}
          {justPurchased && (
            <div className="absolute inset-0 bg-green-400/30 rounded-lg animate-ping" />
          )}
        </div>
      </HoverCardTrigger>
      
      <HoverCardContent className="w-72 p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            <h4 className="font-semibold text-sm">{upgrade.name}</h4>
            <Badge variant="outline" className="text-xs">One-time</Badge>
          </div>
          <div className="text-sm text-muted-foreground whitespace-pre-line">
            {getDetailedDescription()}
          </div>
          <div className="pt-2 border-t">
            <div className="text-xs font-mono text-center">
              Click to purchase
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export const OneTimeUpgradeIcon = memo(OneTimeUpgradeIconComponent);