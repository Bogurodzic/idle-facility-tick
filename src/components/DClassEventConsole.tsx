import { useGameStore } from "@/store/gameStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, Skull, AlertTriangle } from "lucide-react";
import { useEffect, useRef } from "react";

export const DClassEventConsole = () => {
  const { dClassEvents } = useGameStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new events are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [dClassEvents]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getEventIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Skull className="w-3 h-3 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-3 h-3 text-yellow-400" />;
      default:
        return <Terminal className="w-3 h-3 text-terminal-green" />;
    }
  };

  const getEventColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-terminal-green';
    }
  };

  return (
    <Card className="facility-panel w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-terminal-green" />
            <CardTitle className="text-terminal-green">
              D-CLASS OPERATIONAL LOG
            </CardTitle>
            <Badge variant="outline" className="scp-classification bg-background border-terminal-green/30">
              LIVE FEED
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Events: {dClassEvents.length}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="bg-black/80 border-t border-terminal-green/20">
          <ScrollArea className="h-64 p-4" ref={scrollRef}>
            <div className="space-y-2 font-mono text-xs">
              {dClassEvents.length === 0 ? (
                <div className="text-muted-foreground italic">
                  [SYSTEM] Monitoring D-Class operations... No recent incidents to report.
                </div>
              ) : (
                dClassEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-2 group hover:bg-muted/10 p-1 rounded">
                    <span className="text-muted-foreground shrink-0">
                      [{formatTimestamp(event.timestamp)}]
                    </span>
                    <div className="flex items-center gap-1">
                      {getEventIcon(event.severity)}
                    </div>
                    <span className={`${getEventColor(event.severity)} leading-relaxed`}>
                      {event.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};