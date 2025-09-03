import { useGameStore } from "@/store/gameStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Personnel } from "@/store/scp087.types";
import { ArrowUp, Zap, Shield, RotateCcw, User } from "lucide-react";

interface PersonnelUpgradeModalProps {
  personnel: Personnel | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PersonnelUpgradeModal = ({ personnel, isOpen, onClose }: PersonnelUpgradeModalProps) => {
  const { scp087, upgradePersonnel, replacePersonnel } = useGameStore();

  if (!personnel) return null;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return Math.floor(num).toString();
  };

  const getLevelCost = () => 50 + (personnel.level * 25);
  const getSpeedCost = () => Math.round(30 + (personnel.speed * 20));
  const getSurvivalCost = () => Math.round(40 + (personnel.survivalRate * 50));
  const getReplacementCost = () => 100;

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Scout": return "text-blue-400";
      case "Research": return "text-purple-400";
      case "Handler": return "text-green-400";
      default: return "text-muted-foreground";
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "Scout": return "Fast movement, early encounter detection";
      case "Research": return "Resource efficiency, data collection bonuses";
      case "Handler": return "High survival rate, encounter resolution";
      default: return "";
    }
  };

  const experienceToNextLevel = personnel.level * 100;
  const experienceProgress = Math.min(100, (personnel.experience / experienceToNextLevel) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Personnel Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Personnel Info */}
          <div className="bg-muted/50 p-3 rounded space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{personnel.name}</h3>
              <Badge variant="outline" className={getRoleColor(personnel.role)}>
                {personnel.role}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {getRoleDescription(personnel.role)}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm">Status:</span>
              <Badge variant={personnel.status === "active" ? "default" : "secondary"}>
                {personnel.status}
              </Badge>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 p-2 rounded text-center">
                <div className="text-lg font-bold">{personnel.level}</div>
                <div className="text-xs text-muted-foreground">Level</div>
              </div>
              <div className="bg-muted/30 p-2 rounded text-center">
                <div className="text-lg font-bold">{personnel.speed.toFixed(1)}x</div>
                <div className="text-xs text-muted-foreground">Speed</div>
              </div>
              <div className="bg-muted/30 p-2 rounded text-center">
                <div className="text-lg font-bold">{Math.round(personnel.survivalRate * 100)}%</div>
                <div className="text-xs text-muted-foreground">Survival</div>
              </div>
              <div className="bg-muted/30 p-2 rounded text-center">
                <div className="text-lg font-bold">{formatNumber(personnel.experience)}</div>
                <div className="text-xs text-muted-foreground">Experience</div>
              </div>
            </div>

            {/* Experience Progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Experience to Next Level</span>
                <span>{formatNumber(personnel.experience)}/{formatNumber(experienceToNextLevel)}</span>
              </div>
              <Progress value={experienceProgress} className="h-2" />
            </div>
          </div>

          <Separator />

          {/* Upgrades */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Upgrades</h4>
            
            <div className="grid gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => upgradePersonnel(personnel.id, "level")}
                disabled={scp087.paranoiaEnergy < getLevelCost()}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <ArrowUp className="w-4 h-4" />
                  <span>Level Up</span>
                </div>
                <span className="text-scp-087 font-mono">{formatNumber(getLevelCost())}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => upgradePersonnel(personnel.id, "speed")}
                disabled={scp087.paranoiaEnergy < getSpeedCost()}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>Increase Speed</span>
                </div>
                <span className="text-scp-087 font-mono">{formatNumber(getSpeedCost())}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => upgradePersonnel(personnel.id, "survival")}
                disabled={scp087.paranoiaEnergy < getSurvivalCost()}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Improve Survival</span>
                </div>
                <span className="text-scp-087 font-mono">{formatNumber(getSurvivalCost())}</span>
              </Button>
            </div>

            <Separator />

            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                replacePersonnel(personnel.id);
                onClose();
              }}
              disabled={scp087.paranoiaEnergy < getReplacementCost()}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                <span>Replace Personnel</span>
              </div>
              <span className="font-mono">{formatNumber(getReplacementCost())}</span>
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center pt-2">
            Current Paranoia Energy: {formatNumber(scp087.paranoiaEnergy)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};