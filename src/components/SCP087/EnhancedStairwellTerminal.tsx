import React, { useEffect, useMemo, useRef, useState } from "react";
import { useGameStore } from "../../store/gameStore";
import type { Encounter, Personnel, EncounterKind } from "../../store/scp087.types";
import { Button } from "../ui/button";
import { PersonnelUpgradeModal } from "./PersonnelUpgradeModal";
import { Progress } from "../ui/progress";
import { Users, AlertTriangle } from "lucide-react";

/**
 * Enhanced SCP-087 Terminal Monitor v3.0
 * - Improved UI/UX with integrated controls
 * - Fixed alignment and centering issues
 * - Enhanced symbol display with annotations
 * - Vertical progress bar and integrated deployment
 */

type Props = { width?: number };

const STEP = 34;
const TICKS_VISIBLE = 9;

const pad3 = (n: number) => String(n).padStart(3, "0");

export default function EnhancedStairwellTerminal({ width = 28 }: Props) {
  const scp087 = useGameStore(state => state.scp087);
  const toggleFlashlight = useGameStore(state => state.toggleFlashlight);
  const drainFlashlight = useGameStore(state => state.drainFlashlight);
  const rechargeFlashlightV2 = useGameStore(state => state.rechargeFlashlightV2);
  const movePersonnel = useGameStore(state => state.movePersonnel);
  const spawnEncounterAtDepth = useGameStore(state => state.spawnEncounterAtDepth);
  const resolveEncounter = useGameStore(state => state.resolveEncounter);
  const cullExpiredEncounters = useGameStore(state => state.cullExpiredEncounters);
  const toggleTeamExploration = useGameStore(state => state.toggleTeamExploration);
  
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
  const [recentEncounter, setRecentEncounter] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  // Handle legacy store format
  const flashlight = scp087?.flashlight || {
    on: (scp087?.flashlightBattery || 100) > 0,
    charge: scp087?.flashlightBattery || 100,
    capacity: 100,
    drainPerSec: 6,
    rechargePerSec: 22,
    lowThreshold: 20,
  };
  
  const personnel = scp087?.personnel?.length ? scp087.personnel : [
    { 
      id: "p1", 
      name: "Operative Δ-7", 
      role: "Scout" as const, 
      absoluteDepth: 0, 
      lane: "L" as const,
      level: 1,
      experience: 0,
      speed: 1.2,
      survivalRate: 0.9,
      active: false,
      status: "active" as const
    },
    { 
      id: "p2", 
      name: "Tech A. Morse", 
      role: "Research" as const, 
      absoluteDepth: 68, 
      lane: "R" as const,
      level: 1,
      experience: 0,
      speed: 0.8,
      survivalRate: 0.7,
      active: false,
      status: "active" as const
    },
    { 
      id: "p3", 
      name: "Handler R-3", 
      role: "Handler" as const, 
      absoluteDepth: 136, 
      lane: "L" as const,
      level: 1,
      experience: 0,
      speed: 1.0,
      survivalRate: 0.95,
      active: false,
      status: "active" as const
    },
  ];
  
  const activeEncounters: Encounter[] = scp087?.activeEncounters?.map((e: any) => {
    if ('kind' in e) {
      return e as Encounter;
    } else {
      return {
        id: e.id,
        x: 0, y: 0,
        kind: e.type === "hostile" ? "087-1" as const : "anomaly" as const,
        absoluteDepth: (e.position || 0) * 34,
        rewardPE: e.type === "hostile" ? 150 : 40,
        expiresAt: Date.now() + 10000
      } as Encounter;
    }
  }) || [];

  useEffect(() => {
    if (Date.now() - scp087.lastEncounter < 3000) {
      setRecentEncounter(true);
      const timer = setTimeout(() => setRecentEncounter(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [scp087.lastEncounter]);

  if (!scp087) {
    return <div className="p-4 text-terminal-green font-mono">Initializing SCP-087 Terminal...</div>;
  }

  const depth = scp087.currentDepth || scp087.depth || 0;
  const f = flashlight;

  const [t, setT] = useState(0);
  const raf = useRef<number | null>(null);

  // Animation/update loop
  useEffect(() => {
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      setT(p => p + dt);

      if (f.on) drainFlashlight(dt); 
      else rechargeFlashlightV2(dt * 0.7);
      movePersonnel(dt);
      cullExpiredEncounters();

      if (Math.random() < 0.025 && f.on) {
        const jitter = (Math.random() * 3 - 1.5) * STEP;
        const targetDepth = Math.max(0, Math.round(depth / STEP) * STEP + jitter);
        const kind: EncounterKind = Math.random() < 0.2 ? "087-1" : "anomaly";
        spawnEncounterAtDepth(targetDepth, kind);
      }

      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [f.on, drainFlashlight, rechargeFlashlightV2, movePersonnel, cullExpiredEncounters, spawnEncounterAtDepth, depth]);

  const anchor = Math.floor(depth / STEP) * STEP;
  const start = anchor - Math.floor(TICKS_VISIBLE / 2) * STEP;

  // Battery bar (12 cells for better resolution)
  const battCells = 12;
  const battFill = Math.round((f.charge / f.capacity) * battCells);
  const battBar = "█".repeat(Math.max(0, Math.min(battCells, battFill))) +
                  "░".repeat(Math.max(0, battCells - battFill));

  // Progress calculation for team deployment
  const deployProgress = scp087.teamDeployed ? ((Date.now() % 5000) / 5000) * 100 : 0;
  const verticalProgressChars = "▁▂▃▄▅▆▇█";
  const progressIndex = Math.floor((deployProgress / 100) * (verticalProgressChars.length - 1));
  const progressChar = scp087.teamDeployed ? verticalProgressChars[progressIndex] : "░";

  // Enhanced rendering with improved alignment and annotations
  type Row = { text: string; annotations?: string };
  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];

    // Enhanced header with progress bar
    out.push({text: "╔════ SCP-087 TERMINAL v3.0 ════╗"});
    out.push({text: "║ █ SECURE ██ CONTAIN ██ PROTECT ║"});
    out.push({text: "╠════════════════════════════════╣"});
    out.push({text: `║ FLASHLIGHT: [${battBar}] ║`});
    out.push({text: `║ DEPTH: ${String(Math.round(depth)).padStart(6, " ")}m   TEAM: ${scp087.teamDeployed ? "ACTIVE" : "IDLE"}  ║`});
    out.push({text: "╠════════════════════════════════╣"});
    
    const within = (abs: number, tick: number) => {
      const top = tick - STEP / 2;
      const bot = tick + STEP / 2;
      return abs >= top && abs < bot;
    };

    // Build enhanced tick blocks
    for (let i = 0; i < TICKS_VISIBLE; i++) {
      const d = start + i * STEP;
      const label = pad3(Math.max(0, d));
      const isCurrentDepth = within(depth, d);
      
      const has0871 = activeEncounters.some(e => e.kind === "087-1" && within(e.absoluteDepth, d));
      const hasAnom = activeEncounters.some(e => e.kind === "anomaly" && within(e.absoluteDepth, d));
      const hasTeam = personnel.some(p => within(p.absoluteDepth, d));
      
      // Get encounter details for annotations
      const encounter087 = activeEncounters.find(e => e.kind === "087-1" && within(e.absoluteDepth, d));
      const encounterAnom = activeEncounters.find(e => e.kind === "anomaly" && within(e.absoluteDepth, d));
      const teamMember = personnel.find(p => within(p.absoluteDepth, d));

      // Progress bar on left side
      const progressCol = scp087.teamDeployed ? progressChar : "║";
      
      // Enhanced top connector
      const topConnector = isCurrentDepth ? 
        `${progressCol} ╓───┴───╖ ` : 
        `${progressCol} ┌───┴───┐ `;
      out.push({text: topConnector});
      
      // Enhanced label line with better centering
      let annotations = "";
      if (has0871) {
        annotations = ` ◄─── SCP-087-1! (+${encounter087?.rewardPE || 150}PE)`;
      } else if (hasAnom) {
        annotations = ` ◄─── ANOMALY (+${encounterAnom?.rewardPE || 40}PE)`;
      } else if (hasTeam && teamMember) {
        annotations = ` ◄─── ${teamMember.name} (${teamMember.role})`;
      } else if (isCurrentDepth) {
        annotations = ` ◄─── CURRENT POSITION`;
      }

      const centerChar = has0871 ? "☻" : hasAnom ? "◉" : hasTeam ? "▲" : isCurrentDepth ? "►" : " ";
      const labelLine = isCurrentDepth ? 
        `${progressCol} ║ ${centerChar} ${label} ${centerChar} ║${annotations}` :
        `${progressCol} │ ${centerChar} ${label} ${centerChar} │${annotations}`;
      
      out.push({text: labelLine, annotations});
      
      // Enhanced bottom connector  
      const bottomConnector = isCurrentDepth ? 
        `${progressCol} ╙───┬───╜ ` : 
        `${progressCol} └───┬───┘ `;
      out.push({text: bottomConnector});
      
      // Spine with battery indicator
      const spine = f.charge <= f.lowThreshold ? "░" : "║";
      out.push({text: `${progressCol}     ${spine}     ${i < TICKS_VISIBLE - 1 ? "║" : "╨"}`});
    }

    // Enhanced footer with team status
    const teamComposition = personnel.map(p => `${p.role.charAt(0)}${p.level}`).join(" ");
    const teamDepthRange = personnel.length > 0 ? 
      `${Math.round(Math.min(...personnel.map(p => p.absoluteDepth)))}-${Math.round(Math.max(...personnel.map(p => p.absoluteDepth)))}m` : 
      "NO TEAM";
    
    out.push({text: "╠════════════════════════════════╣"});
    out.push({text: `║ TEAM: ${teamComposition.padEnd(8, " ")} RANGE: ${teamDepthRange.padEnd(10, " ")} ║`});
    out.push({text: `║ CONTACTS: ${String(activeEncounters.length).padStart(2, " ")}  BATTERY: ${String(Math.round((f.charge / f.capacity) * 100)).padStart(3, " ")}% ║`});
    
    if (activeEncounters.length > 0) {
      out.push({text: "║ ⚠  ANOMALOUS READINGS DETECTED  ⚠ ║"});
    }
    
    out.push({text: "╚════════════════════════════════╝"});

    return out;
  }, [depth, f.charge, f.capacity, activeEncounters, personnel, f.lowThreshold, battBar, start, scp087.teamDeployed, progressChar]);

  // Enhanced overlay for clickable encounters
  const overlay = useMemo(() => {
    const map: { id: string; x: number; y: number; label: string; color: string; type: string }[] = [];
    const y0 = 6; // First tick starts after header
    
    activeEncounters.forEach(e => {
      const tickIndex = Math.round((e.absoluteDepth - start) / STEP);
      if (tickIndex >= 0 && tickIndex < TICKS_VISIBLE) {
        const y = y0 + tickIndex * 4 + 1; // Label line per block
        const x = 4; // Center position
        map.push({
          id: e.id,
          x, y,
          label: e.kind === "087-1" ? "☻" : "◉",
          color: e.kind === "087-1" ? "#ff4757" : "#ffa502",
          type: e.kind === "087-1" ? "SCP-087-1" : "Anomaly",
        });
      }
    });
    return map;
  }, [activeEncounters, start]);

  // Measure character dimensions
  const [cell, setCell] = useState({w: 8, h: 16});
  const preRef = useRef<HTMLPreElement | null>(null);
  
  useEffect(() => {
    const el = document.createElement("span");
    el.style.position = "absolute";
    el.style.visibility = "hidden";
    el.style.fontFamily = "'JetBrains Mono', 'Consolas', 'Monaco', monospace";
    el.style.fontSize = "11px";
    el.style.lineHeight = "1.2";
    el.textContent = "M";
    document.body.appendChild(el);
    const r = el.getBoundingClientRect();
    setCell({w: r.width, h: r.height});
    document.body.removeChild(el);
  }, []);

  const handleDeployTeam = () => {
    setIsDeploying(true);
    toggleTeamExploration();
    setTimeout(() => setIsDeploying(false), 1000);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return Math.floor(num).toString();
  };

  return (
    <div className="space-y-4">
      {/* Main Terminal Display */}
      <div className="relative rounded-lg border-2 border-terminal-green/30 bg-terminal-bg overflow-hidden">
        {/* CRT Effects */}
        <div 
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background: `
              radial-gradient(ellipse at center, transparent 0%, hsl(var(--terminal-green) / 0.05) 100%),
              var(--scanlines)
            `,
            boxShadow: `
              inset 0 0 100px hsl(var(--terminal-green) / 0.1),
              0 0 20px hsl(var(--terminal-green) / 0.3)
            `
          }} 
        />
        
        <div className="p-4">
          <div className="relative bg-black/50 rounded border border-terminal-green/20 p-2">
            <pre
              ref={preRef}
              className="font-mono text-xs leading-tight text-terminal-green terminal-glow whitespace-pre select-none"
              style={{
                fontFamily: "'JetBrains Mono', 'Consolas', 'Monaco', monospace",
                fontSize: "11px",
                lineHeight: "1.2",
              }}
            >
              {rows.map((r, i) => r.text).join("\n")}
            </pre>

            {/* Clickable encounters overlay */}
            {overlay.map(o => (
              <button
                key={o.id}
                onClick={() => resolveEncounter(o.id)}
                className="absolute hover:scale-150 transition-all duration-200 z-10 animate-pulse"
                style={{
                  left: o.x * cell.w + 8,
                  top: o.y * cell.h + 8,
                  color: o.color,
                  fontFamily: "'JetBrains Mono', 'Consolas', 'Monaco', monospace",
                  fontSize: "11px",
                  textShadow: `0 0 10px ${o.color}, 0 0 20px ${o.color}`,
                  lineHeight: "1.2",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                title={`Click to resolve ${o.type} (+${o.type === "SCP-087-1" ? "150" : "40"}PE)`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Integrated Control Panel */}
      <div className="grid grid-cols-2 gap-4">
        {/* Resources Display */}
        <div className="space-y-2">
          <div className="bg-card border border-terminal-green/20 p-3 rounded">
            <div className="text-xs text-muted-foreground">Paranoia Energy</div>
            <div className="text-lg font-mono text-scp-087 terminal-glow">
              {formatNumber(scp087.paranoiaEnergy)}
            </div>
          </div>
          <div className="bg-card border border-terminal-green/20 p-3 rounded">
            <div className="text-xs text-muted-foreground">Current Depth</div>
            <div className="text-lg font-mono text-foreground">
              {formatNumber(scp087.currentDepth)}m
            </div>
          </div>
          
          {/* Flashlight Upgrade Status */}
          {(() => {
            const batteryUpgrade = scp087.upgrades.advancedBattery;
            const upgradeLevel = batteryUpgrade?.owned || 0;
            const efficiencyBonus = upgradeLevel * 1; // +1% per level
            const baseCapacity = 100;
            const baseDrainRate = 6;
            const currentCapacity = Math.floor(baseCapacity * (1 + efficiencyBonus / 100));
            const currentDrainRate = Math.max(1, baseDrainRate * (1 - efficiencyBonus / 100));
            
            return upgradeLevel > 0 ? (
              <div className="bg-card border border-yellow-500/20 p-3 rounded">
                <div className="text-xs text-muted-foreground">Flashlight Upgrades</div>
                <div className="text-sm font-mono space-y-1">
                  <div className="text-yellow-400">Level {upgradeLevel} (+{efficiencyBonus}% efficiency)</div>
                  <div className="text-xs text-muted-foreground">
                    Capacity: {currentCapacity} <span className="text-green-400">(+{currentCapacity - baseCapacity})</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Drain Rate: {currentDrainRate.toFixed(1)}/s <span className="text-green-400">({(baseDrainRate - currentDrainRate).toFixed(1)} saved)</span>
                  </div>
                </div>
              </div>
            ) : null;
          })()}
        </div>

        {/* Team Controls */}
        <div className="space-y-2">
          {/* Team Status */}
          {scp087.teamDeployed && (
            <div className="bg-card border border-terminal-green/20 p-3 rounded">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-3 h-3 text-terminal-green" />
                <span className="text-xs text-terminal-green">Team Deployed</span>
              </div>
              <Progress value={deployProgress} className="h-1" />
            </div>
          )}

          {/* Encounter Alert */}
          {recentEncounter && (
            <div className="bg-destructive/10 border border-destructive/20 p-3 rounded">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 text-destructive animate-pulse" />
                <span className="text-xs text-destructive">087-1 Encountered!</span>
              </div>
            </div>
          )}

          {/* Deploy Button */}
          <Button 
            onClick={handleDeployTeam}
            className="w-full font-mono text-xs"
            disabled={recentEncounter || isDeploying}
            variant={scp087.teamDeployed ? "destructive" : "default"}
          >
            {recentEncounter 
              ? "RECOVERING..." 
              : isDeploying
                ? "DEPLOYING..."
              : scp087.teamDeployed 
                ? "◄◄ RECALL TEAM" 
                : "►► DEPLOY TEAM"
            }
          </Button>

          {/* Flashlight Controls */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => toggleFlashlight()}
              className="font-mono text-xs"
            >
              LIGHT {f.on ? "OFF" : "ON"}
            </Button>
            <Button
              size="sm"
              variant="outline"  
              onClick={() => rechargeFlashlightV2(1)}
              className="font-mono text-xs"
            >
              CHARGE
            </Button>
          </div>
        </div>
      </div>

      {/* Personnel Panel */}
      <div className="bg-card border border-terminal-green/20 rounded p-3">
        <div className="text-xs text-muted-foreground mb-2 font-mono">PERSONNEL ROSTER:</div>
        <div className="space-y-1">
          {personnel.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPersonnel(p)}
              className="flex justify-between w-full text-xs font-mono text-muted-foreground hover:text-terminal-green hover:bg-terminal-green/10 rounded px-2 py-1 transition-colors border border-transparent hover:border-terminal-green/20"
            >
              <span className="truncate">{p.name}</span>
              <span>{p.role}</span>
              <span>L{p.level}</span>
              <span>{Math.round(p.absoluteDepth)}m</span>
              <span className={p.lane === "L" ? "text-blue-400" : "text-orange-400"}>{p.lane}</span>
              <span className={p.active ? "text-terminal-green" : "text-gray-500"}>
                {p.active ? "●" : "○"}
              </span>
            </button>
          ))}
        </div>
      </div>

      <PersonnelUpgradeModal
        personnel={selectedPersonnel}
        isOpen={!!selectedPersonnel}
        onClose={() => setSelectedPersonnel(null)}
      />
    </div>
  );
}