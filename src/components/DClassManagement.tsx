import { useGameStore } from "@/store/gameStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Clock, Zap, AlertTriangle, Settings } from "lucide-react";

export const DClassManagement = () => {
  const { 
    facility,
    dClassInventory,
    recruitDClass,
    upgradeDClassFacility,
    dClassFacilityUpgrades
  } = useGameStore();

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return Math.floor(num).toString();
  };

  const getRecruitmentCost = () => {
    const baseCost = 50;
    const currentCount = dClassInventory.count;
    return Math.floor(baseCost + (currentCount * 10));
  };

  const getBulkRecruitmentCost = () => {
    const singleCost = getRecruitmentCost();
    return Math.floor(singleCost * 5 * 0.8); // 20% bulk discount
  };

  const getCapacityUsagePercent = () => {
    return (dClassInventory.count / dClassInventory.capacity) * 100;
  };

  const getThreatLevel = () => {
    const mortalityRate = dClassInventory.mortalityRate * 100;
    if (mortalityRate >= 80) return { level: "CRITICAL", color: "text-red-400" };
    if (mortalityRate >= 60) return { level: "HIGH", color: "text-orange-400" };
    if (mortalityRate >= 40) return { level: "MODERATE", color: "text-yellow-400" };
    return { level: "LOW", color: "text-green-400" };
  };

  const threat = getThreatLevel();

  return (
    <Card className="facility-panel w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-400" />
            <CardTitle className="text-orange-400">
              D-CLASS PERSONNEL MANAGEMENT
            </CardTitle>
            <Badge variant="destructive" className="scp-classification">
              EXPENDABLE
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="text-muted-foreground">Mortality Rate:</span>
              <span className={threat.color}>
                {Math.round(dClassInventory.mortalityRate * 100)}% ({threat.level})
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Current Inventory */}
          <div className="bg-muted/30 p-3 rounded">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-semibold text-muted-foreground">AVAILABLE</span>
            </div>
            <div className="text-lg font-mono text-foreground">
              {Math.floor(dClassInventory.count)}
            </div>
            <div className="text-xs text-muted-foreground">
              Capacity: {dClassInventory.capacity}
            </div>
            <Progress 
              value={getCapacityUsagePercent()} 
              className="h-1 mt-1"
            />
          </div>

          {/* Generation Rate */}
          <div className="bg-muted/30 p-3 rounded">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-muted-foreground">GENERATION</span>
            </div>
            <div className="text-lg font-mono text-foreground">
              {dClassInventory.generationRate.toFixed(1)}/min
            </div>
            <div className="text-xs text-muted-foreground">
              Auto-recruitment active
            </div>
          </div>

          {/* Currently Assigned */}
          <div className="bg-muted/30 p-3 rounded">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-terminal-green" />
              <span className="text-xs font-semibold text-muted-foreground">DEPLOYED</span>
            </div>
            <div className="text-lg font-mono text-foreground">
              {dClassInventory.assigned}
            </div>
            <div className="text-xs text-muted-foreground">
              Active assignments
            </div>
          </div>

          {/* Casualty Statistics */}
          <div className="bg-muted/30 p-3 rounded">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-xs font-semibold text-muted-foreground">CASUALTIES</span>
            </div>
            <div className="text-lg font-mono text-foreground">
              {formatNumber(dClassInventory.totalCasualties)}
            </div>
            <div className="text-xs text-muted-foreground">
              Total lost
            </div>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          {/* Recruitment Controls */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => recruitDClass(1)}
              disabled={
                facility.containmentPoints < getRecruitmentCost() || 
                dClassInventory.count >= dClassInventory.capacity
              }
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>Recruit (1)</span>
              <span className="text-orange-400 font-mono">{formatNumber(getRecruitmentCost())}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => recruitDClass(5)}
              disabled={
                facility.containmentPoints < getBulkRecruitmentCost() || 
                dClassInventory.count + 5 > dClassInventory.capacity
              }
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>Bulk Recruit (5)</span>
              <span className="text-orange-400 font-mono">{formatNumber(getBulkRecruitmentCost())}</span>
            </Button>
          </div>

          {/* Facility Upgrades */}
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => upgradeDClassFacility("capacity")}
              disabled={facility.containmentPoints < dClassFacilityUpgrades.capacity.cost}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              <span>Expand Capacity (+50)</span>
              <span className="text-blue-400 font-mono">
                {formatNumber(dClassFacilityUpgrades.capacity.cost)}
              </span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => upgradeDClassFacility("generation")}
              disabled={facility.containmentPoints < dClassFacilityUpgrades.generation.cost}
              className="flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              <span>Auto-Recruitment (+0.5/min)</span>
              <span className="text-blue-400 font-mono">
                {formatNumber(dClassFacilityUpgrades.generation.cost)}
              </span>
            </Button>
          </div>
        </div>

        {/* Status Messages */}
        {dClassInventory.count === 0 && (
          <div className="bg-red-950/20 border border-red-500/30 p-3 rounded">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 font-semibold text-sm">
                CRITICAL: NO D-CLASS AVAILABLE - SCP OPERATIONS SUSPENDED
              </span>
            </div>
          </div>
        )}

        {dClassInventory.count < 5 && dClassInventory.count > 0 && (
          <div className="bg-yellow-950/20 border border-yellow-500/30 p-3 rounded">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-semibold text-sm">
                WARNING: LOW D-CLASS INVENTORY - RECOMMEND IMMEDIATE RECRUITMENT
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};