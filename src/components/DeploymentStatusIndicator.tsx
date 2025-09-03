import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, Users } from 'lucide-react';

export const DeploymentStatusIndicator = () => {
  const { scp087, dClassInventory } = useGameStore();
  
  const getDeploymentStatus = () => {
    if (scp087.teamDeployed) {
      return {
        status: 'deployed',
        icon: CheckCircle,
        message: 'Exploration team active in SCP-087',
        variant: 'default' as const
      };
    }
    
    if (dClassInventory.count < 4) {
      return {
        status: 'insufficient',
        icon: XCircle,
        message: `Need 4 D-Class personnel (${dClassInventory.count} available)`,
        variant: 'destructive' as const
      };
    }
    
    return {
      status: 'ready',
      icon: Users,
      message: 'Ready for deployment',
      variant: 'secondary' as const
    };
  };

  const status = getDeploymentStatus();
  const IconComponent = status.icon;

  return (
    <Alert className="border-terminal-green/20">
      <IconComponent className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-xs font-mono">{status.message}</span>
        <Badge variant={status.variant} className="ml-2 text-xs">
          {status.status.toUpperCase()}
        </Badge>
      </AlertDescription>
    </Alert>
  );
};