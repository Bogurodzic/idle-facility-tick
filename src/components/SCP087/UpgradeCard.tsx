import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Upgrade } from "@/store/gameStore";
import { LucideIcon } from "lucide-react";
import { useState, useEffect } from "react";

interface UpgradeCardProps {
  upgrade: Upgrade;
  icon: LucideIcon;
  canAfford: boolean;
  onPurchase: () => void;
  formatCurrency: (num: number) => string;
}

export const UpgradeCard = ({ 
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
                  level < 3 ? "bg-gradient-to-br from-yellow-500/20 to-amber-600/20" :
                  level < 6 ? "bg-gradient-to-br from-yellow-400/30 to-amber-500/30" :
                  "bg-gradient-to-br from-yellow-300/40 to-amber-400/40",
          borderClass: level === 0 ? "border-muted" :
                      level < 3 ? "border-yellow-500/30" :
                      level < 6 ? "border-yellow-400/50" :
                      "border-yellow-300/70 shadow-lg shadow-yellow-500/20",
          iconColor: level === 0 ? "text-muted-foreground" :
                    level < 3 ? "text-yellow-600" :
                    level < 6 ? "text-yellow-500" :
                    "text-yellow-400 drop-shadow-glow",
          effect: level >= 3 ? "animate-pulse" : ""
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
        return {
          bgClass: "bg-muted/30",
          borderClass: "border-muted",
          iconColor: "text-muted-foreground",
          effect: ""
        };
    }
  };

  const visuals = getUpgradeVisuals();

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
            upgrade.owned >= 10 ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-black" :
            upgrade.owned >= 5 ? "bg-gradient-to-r from-blue-500 to-purple-600" :
            "bg-primary"
          )}
        >
          L{upgrade.owned}
        </Badge>
      )}
      
      {/* Mastery indicator for high levels */}
      {upgrade.owned >= 10 && (
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full animate-pulse" />
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
          
          <p className="text-xs text-muted-foreground mb-2">
            {upgrade.id === 'advancedBattery' && upgrade.owned > 0 
              ? `${upgrade.description} (Currently: +${upgrade.owned}% efficiency)`
              : upgrade.description}
          </p>
          
          {/* Visual effect indicator for certain upgrades */}
          {upgrade.owned > 0 && (upgrade.id === 'advancedBattery' || upgrade.id === 'training') && (
            <div className="mb-2">
              <Progress 
                value={upgrade.id === 'advancedBattery' ? Math.min((upgrade.owned / 20) * 100, 100) : (upgrade.owned / 10) * 100} 
                className="h-1"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {upgrade.id === 'advancedBattery' 
                  ? `Efficiency: +${upgrade.owned}%` 
                  : `Efficiency: ${Math.floor((upgrade.owned / 10) * 100)}%`}
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