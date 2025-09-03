import { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import { FacilityHeader } from "@/components/FacilityHeader";
import { SCP087Panel } from "@/components/SCP087Panel";
import { GameTicker } from "@/components/GameTicker";
import { DClassManagement } from "@/components/DClassManagement";
import { DClassEventConsole } from "@/components/DClassEventConsole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, FileText } from "lucide-react";

const Index = () => {
  const { gameStarted, startGame } = useGameStore();

  useEffect(() => {
    // Auto-start game if returning player
    const savedData = localStorage.getItem('scp-facility-game');
    if (savedData) {
      startGame();
    }
  }, [startGame]);

  if (!gameStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="facility-panel max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Badge variant="destructive" className="scp-classification text-lg px-4 py-2">
                CLASSIFIED
              </Badge>
            </div>
            <CardTitle className="text-3xl font-bold">
              SCP FOUNDATION
            </CardTitle>
            <p className="text-lg text-muted-foreground">
              Secure, Contain, Protect - Idle Facility Management
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-muted/50 p-4 rounded border-l-4 border-primary">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-2">FACILITY DIRECTIVE</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    You have been assigned to manage Site-19's autonomous containment systems. 
                    Your objective is to maintain containment of multiple SCP entities while 
                    optimizing resource generation and facility security protocols.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold text-scp-087">Current Assignments:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• SCP-087 - The Stairwell</li>
                  <li>• SCP-173 - The Sculpture</li>
                  <li>• SCP-999 - The Tickle Monster</li>
                  <li>• SCP-914 - The Clockworks</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-accent">System Features:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Offline progression tracking</li>
                  <li>• Automated containment protocols</li>
                  <li>• Research & development tree</li>
                  <li>• Foundation knowledge accumulation</li>
                </ul>
              </div>
            </div>
            
            <div className="pt-4 border-t border-border">
              <Button 
                onClick={startGame} 
                size="lg" 
                className="w-full bg-primary hover:bg-primary/80 text-black font-semibold"
              >
                <Play className="w-5 h-5 mr-2" />
                INITIALIZE FACILITY SYSTEMS
              </Button>
            </div>
            
            <p className="text-xs text-center text-muted-foreground">
              <span className="redacted">█████</span> FOUNDATION PERSONNEL ONLY <span className="redacted">█████</span>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="space-y-6 max-w-7xl mx-auto">
        <GameTicker />
        <FacilityHeader />
        <DClassManagement />
        <DClassEventConsole />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <SCP087Panel />
          
          {/* Placeholder panels for other SCPs */}
          <Card className="facility-panel opacity-60">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="scp-classification">
                  EUCLID
                </Badge>
                <CardTitle className="text-scp-173">SCP-173 - The Sculpture</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Containment protocols initializing...</p>
            </CardContent>
          </Card>
          
          <Card className="facility-panel opacity-60">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="scp-classification">
                  SAFE
                </Badge>
                <CardTitle className="text-scp-999">SCP-999 - The Tickle Monster</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Containment protocols initializing...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;