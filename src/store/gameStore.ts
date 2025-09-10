import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Encounter, Personnel, FlashlightState, EncounterKind } from './scp087.types';

// Types for game state
export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  owned: number;
  effect: number;
  tier?: 'equipment' | 'personnel' | 'research' | 'facility';
  baseCost?: number;
  maxLevel?: number;
  milestones?: number[];
  synergyWith?: string[];
  unlockCondition?: {
    upgradeId: string;
    level: number;
  };
}

export interface SCP087State {
  paranoiaEnergy: number;
  currentDepth: number;
  depth: number; // alias for currentDepth for new monitor
  encounterChance: number;
  upgrades: Record<string, Upgrade>;
  autoDescend: boolean;
  lastEncounter: number;
  flashlightBattery: number; // 0-100 (legacy)
  flashlightRecharging: boolean;
  flashlight: FlashlightState;
  personnel: Personnel[];
  activeEncounters: Encounter[];
  teamActive: boolean;
  teamDeployed: boolean; // For UI consistency
  // Legacy arrays for backward compatibility
  oldPersonnel?: Array<{ id: string; position: number; direction: 'down' | 'up' }>;
  oldActiveEncounters?: Array<{ id: string; position: number; type: 'hostile' | 'neutral'; symbol: string }>;
}

export interface SCP173State {
  observationPoints: number;
  blinkMeter: number;
  guardCount: number;
  upgrades: Record<string, Upgrade>;
  lastBreach: number;
  breachActive: boolean;
}

export interface SCP999State {
  euphoriaOrbs: number;
  candyStock: number;
  happinessMultiplier: number;
  upgrades: Record<string, Upgrade>;
  activeBuffs: Array<{ type: string; duration: number; multiplier: number }>;
}

export interface SCP914State {
  refinedMaterials: Record<string, number>;
  processQueue: Array<{ item: string; setting: string; timeLeft: number }>;
  upgrades: Record<string, Upgrade>;
  currentSetting: string;
}

export interface DClassEvent {
  id: string;
  timestamp: number;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  scpId?: string;
  dClassId?: string;
}

export interface DClassInventory {
  count: number;
  capacity: number;
  generationRate: number;
  assigned: number;
  mortalityRate: number;
  totalCasualties: number;
  totalRecruitments: number;
}

export interface DClassFacilityUpgrade {
  cost: number;
  level: number;
}

export interface FacilityState {
  containmentPoints: number;
  researchPoints: number;
  foundationKnowledge: number;
  globalUpgrades: Record<string, Upgrade>;
  lastSaveTime: number;
  totalPlayTime: number;
}

export interface GameState {
  scp087: SCP087State;
  scp173: SCP173State;
  scp999: SCP999State;
  scp914: SCP914State;
  facility: FacilityState;
  dClassInventory: DClassInventory;
  dClassFacilityUpgrades: {
    capacity: DClassFacilityUpgrade;
    generation: DClassFacilityUpgrade;
    survival: DClassFacilityUpgrade;
  };
  dClassEvents: DClassEvent[];
  gameStarted: boolean;
  tickInterval: number;
}

// Research & Development System for SCP-087
// Enhanced Upgrade System with Tier-Based Scaling
const initialSCP087Upgrades: Record<string, Upgrade> = {
  // EQUIPMENT TIER - Frequent Purchases (1.07x scaling like Clicker Heroes)
  advancedBattery: {
    id: 'advancedBattery',
    name: 'Advanced Battery System',
    description: 'Military-grade power cells increase flashlight efficiency. Each level reduces drain by 1% and increases capacity.',
    cost: 5,
    baseCost: 5,
    owned: 0,
    effect: 0.01,
    tier: 'equipment',
    milestones: [5, 10, 25, 50, 100],
    synergyWith: ['tacticalModules', 'autoRecharge']
  },
  autoRecharge: {
    id: 'autoRecharge',
    name: 'Auto-Recharge System',
    description: 'Automated battery charging system. Gradually recharges flashlight when OFF. Each level increases recharge rate.',
    cost: 150,
    baseCost: 150,
    owned: 0,
    effect: 22,
    tier: 'equipment',
    milestones: [3, 7, 15],
    unlockCondition: { upgradeId: 'advancedBattery', level: 3 },
    synergyWith: ['advancedBattery']
  },
  tacticalModules: {
    id: 'tacticalModules',
    name: 'Tactical Flashlight Modules',
    description: 'Advanced beam focusing and multi-spectrum lighting. Unlocks special illumination modes.',
    cost: 25,
    baseCost: 25,
    owned: 0,
    effect: 0.15,
    tier: 'equipment',
    milestones: [3, 7, 15],
    synergyWith: ['advancedBattery']
  },
  emergencyCache: {
    id: 'emergencyCache',
    name: 'Emergency Equipment Cache',
    description: 'Redundant systems and backup equipment reduce equipment failure risk by 10% per level.',
    cost: 45,
    baseCost: 45,
    owned: 0,
    effect: 0.10,
    tier: 'equipment',
    maxLevel: 10
  },

  // PERSONNEL TIER - Medium Purchases (1.15x scaling like Cookie Clicker)
  crossTraining: {
    id: 'crossTraining',
    name: 'Cross-Training Initiative',
    description: 'Multi-role training program. Personnel gain +15% efficiency and can adapt to different situations.',
    cost: 100,
    baseCost: 100,
    owned: 0,
    effect: 1.15,
    tier: 'personnel',
    milestones: [5, 10, 20],
    synergyWith: ['psychologyProgram']
  },
  psychologyProgram: {
    id: 'psychologyProgram',
    name: 'Psychological Conditioning',
    description: 'Mental resilience training increases survival rate by 8% and reduces fear effects.',
    cost: 150,
    baseCost: 150,
    owned: 0,
    effect: 1.08,
    tier: 'personnel',
    milestones: [3, 8, 15],
    synergyWith: ['crossTraining', 'eliteRecruitment']
  },
  eliteRecruitment: {
    id: 'eliteRecruitment',
    name: 'Elite Recruitment Program',
    description: 'Attract exceptional personnel. New recruits start with +25% stats and better specializations.',
    cost: 200,
    baseCost: 200,
    owned: 0,
    effect: 1.25,
    tier: 'personnel',
    maxLevel: 8,
    synergyWith: ['psychologyProgram']
  },
  experienceAccelerator: {
    id: 'experienceAccelerator',
    name: 'Accelerated Training Protocol',
    description: 'Advanced training simulators. Personnel gain experience 40% faster with improved skill retention.',
    cost: 300,
    baseCost: 300,
    owned: 0,
    effect: 1.40,
    tier: 'personnel',
    milestones: [5, 12, 25]
  },

  // RESEARCH TIER - Expensive Purchases (1.20x scaling)
  scpAnalysis: {
    id: 'scpAnalysis',
    name: 'SCP-087 Analysis Project',
    description: 'Deep study of anomalous properties. Each level improves encounter prediction and increases PE yield by 20%.',
    cost: 500,
    baseCost: 500,
    owned: 0,
    effect: 1.20,
    tier: 'research',
    milestones: [3, 7, 15, 30],
    synergyWith: ['anomalousPhysics']
  },
  anomalousPhysics: {
    id: 'anomalousPhysics',
    name: 'Anomalous Physics Research',
    description: 'Fundamental research into impossible geometries. Unlocks advanced containment techniques.',
    cost: 800,
    baseCost: 800,
    owned: 0,
    effect: 1.30,
    tier: 'research',
    milestones: [2, 5, 10],
    synergyWith: ['scpAnalysis', 'containmentBreakthrough'],
    unlockCondition: { upgradeId: 'scpAnalysis', level: 3 }
  },
  containmentBreakthrough: {
    id: 'containmentBreakthrough',
    name: 'Containment Breakthrough',
    description: 'Revolutionary containment protocols provide facility-wide bonuses and reduce all risks by 15%.',
    cost: 1200,
    baseCost: 1200,
    owned: 0,
    effect: 0.85,
    tier: 'research',
    maxLevel: 5,
    unlockCondition: { upgradeId: 'anomalousPhysics', level: 2 }
  },

  // FACILITY TIER - Very Expensive (1.25x scaling)
  site19Integration: {
    id: 'site19Integration',
    name: 'Site-19 Integration Protocol',
    description: 'Direct link to Foundation headquarters. Unlocks cross-SCP research bonuses and emergency support.',
    cost: 2000,
    baseCost: 2000,
    owned: 0,
    effect: 1.50,
    tier: 'facility',
    maxLevel: 3,
    synergyWith: ['foundationNetwork'],
    unlockCondition: { upgradeId: 'containmentBreakthrough', level: 2 }
  },
  foundationNetwork: {
    id: 'foundationNetwork',
    name: 'Foundation Network Access',
    description: 'Classified database access provides global research bonuses and operational intelligence.',
    cost: 3500,
    baseCost: 3500,
    owned: 0,
    effect: 2.00,
    tier: 'facility',
    maxLevel: 2,
    unlockCondition: { upgradeId: 'site19Integration', level: 1 }
  },
  o5Authorization: {
    id: 'o5Authorization',
    name: 'O5 Council Authorization',
    description: 'Highest clearance level removes operational limitations and grants access to anomalous technologies.',
    cost: 10000,
    baseCost: 10000,
    owned: 0,
    effect: 3.00,
    tier: 'facility',
    maxLevel: 1,
    unlockCondition: { upgradeId: 'foundationNetwork', level: 1 }
  }
};

// Default state
const defaultState: GameState = {
  scp087: {
    paranoiaEnergy: 0,
    currentDepth: 0,
    depth: 0,
    encounterChance: 0.1,
    upgrades: initialSCP087Upgrades,
    autoDescend: false,
    lastEncounter: 0,
    flashlightBattery: 100,
    flashlightRecharging: false,
    flashlight: {
      on: true,
      charge: 100,
      capacity: 100,
      drainPerSec: 6,
      rechargePerSec: 0,
      lowThreshold: 20,
    },
    personnel: [
      { 
        id: "p1", 
        name: "D-3142", 
        role: "Scout", 
        absoluteDepth: 0, 
        lane: "L",
        level: 1,
        experience: 0,
        speed: 1.0,
        survivalRate: 0.6,
        active: false,
        status: "active"
      },
      { 
        id: "p2", 
        name: "D-7853", 
        role: "Research", 
        absoluteDepth: 0, 
        lane: "R",
        level: 1,
        experience: 0,
        speed: 1.0,
        survivalRate: 0.5,
        active: false,
        status: "active"
      },
    ],
    teamActive: false,
    teamDeployed: false,
    activeEncounters: []
  },
  scp173: {
    observationPoints: 0,
    blinkMeter: 0,
    guardCount: 1,
    upgrades: {},
    lastBreach: 0,
    breachActive: false
  },
  scp999: {
    euphoriaOrbs: 0,
    candyStock: 10,
    happinessMultiplier: 1,
    upgrades: {},
    activeBuffs: []
  },
  scp914: {
    refinedMaterials: {},
    processQueue: [],
    upgrades: {},
    currentSetting: '1:1'
  },
  facility: {
    containmentPoints: 100,
    researchPoints: 50,
    foundationKnowledge: 0,
    globalUpgrades: {},
    lastSaveTime: Date.now(),
    totalPlayTime: 0
  },
  dClassInventory: {
    count: 10,
    capacity: 50,
    generationRate: 0.2,
    assigned: 0,
    mortalityRate: 0.4,
    totalCasualties: 0,
    totalRecruitments: 10
  },
  dClassFacilityUpgrades: {
    capacity: { cost: 200, level: 0 },
    generation: { cost: 150, level: 0 },
    survival: { cost: 300, level: 0 }
  },
  dClassEvents: [],
  gameStarted: false,
  tickInterval: 1000
};

type GameActions = {
  // SCP-087 Actions - Personnel Management
  toggleTeamExploration: () => void;
  upgradePersonnel: (personnelId: string, upgradeType: string) => void;
  replacePersonnel: (personnelId: string) => void;
  purchaseSCP087Upgrade: (upgradeId: string) => void;
  rechargeFlashlight: () => void;
  
  // New SCP-087 Actions for Terminal v2.1
  toggleFlashlight: () => void;
  drainFlashlight: (dt: number) => void;
  rechargeFlashlightV2: (dt: number) => void;
  manualChargeFlashlight: () => void;
  movePersonnel: (dt: number) => void;
  spawnEncounterAtDepth: (absoluteDepth: number, kind: EncounterKind) => void;
  resolveEncounter: (id: string) => void;
  cullExpiredEncounters: () => void;
  startEncounterInteraction: (encounterId: string) => boolean;
  updateEncounterProgress: () => void;
  abortEncounter: (encounterId: string) => void;
  
  // D-Class Management Actions
  recruitDClass: (quantity: number) => void;
  assignDClass: (scpId: string, quantity: number) => void;
  processDClassCasualties: (casualties: number) => void;
  upgradeDClassFacility: (upgradeType: "capacity" | "generation" | "survival") => void;
  addDClassEvent: (message: string, severity?: 'info' | 'warning' | 'critical', scpId?: string) => void;
  validateTeamStates: () => void;
  
  // SCP-173 Actions
  blink: () => void;
  
  // SCP-999 Actions
  feedCandy: () => void;
  
  // Facility Actions
  tick: () => void;
  startGame: () => void;
  resetFacility: () => void;
  calculateOfflineProgress: () => void;
};

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => {
      // Helper function to apply flashlight upgrade bonuses
      const applyFlashlightUpgrades = (state: GameState): GameState => {
        const batteryUpgrade = state.scp087.upgrades.advancedBattery;
        if (batteryUpgrade && batteryUpgrade.owned > 0) {
          const efficiencyBonus = batteryUpgrade.owned * 0.01; // +1% per level
          const baseDrainRate = 6; // Original drain rate
          const baseCapacity = 100; // Original capacity
          
          return {
            ...state,
            scp087: {
              ...state.scp087,
              flashlight: {
                ...state.scp087.flashlight,
                capacity: Math.floor(baseCapacity * (1 + efficiencyBonus)),
                drainPerSec: Math.max(1, baseDrainRate * (1 - efficiencyBonus))
              }
            }
          };
        }
        return state;
      };

      return {
        ...defaultState,

        // SCP-087 Actions - Personnel Management
        toggleTeamExploration: () => {
          const state = get();
          const { addDClassEvent } = state;
          
          // Safety check - ensure personnel exists
          if (!state.scp087.personnel || !Array.isArray(state.scp087.personnel)) {
            console.error("Personnel not initialized, cannot toggle team");
            return;
          }

          // State validation and correction logic
          const validateAndFixStates = () => {
            const currentState = get();
            let needsCorrection = false;
            let correctedState = { ...currentState };

            // Rule 1: If assigned D-Class = 0, team should not be active/deployed
            if (currentState.dClassInventory.assigned === 0 && (currentState.scp087.teamActive || currentState.scp087.teamDeployed)) {
              console.log("[STATE-FIX] No assigned D-Class but team marked as active - correcting");
              correctedState.scp087.teamActive = false;
              correctedState.scp087.teamDeployed = false;
              needsCorrection = true;
            }

            // Rule 2: teamActive and teamDeployed should always match
            if (currentState.scp087.teamActive !== currentState.scp087.teamDeployed) {
              console.log(`[STATE-FIX] teamActive (${currentState.scp087.teamActive}) != teamDeployed (${currentState.scp087.teamDeployed}) - syncing`);
              correctedState.scp087.teamDeployed = currentState.scp087.teamActive;
              needsCorrection = true;
            }

            // Rule 3: If team is active but no personnel are marked active, fix personnel
            if (currentState.scp087.teamActive && !currentState.scp087.personnel.some(p => p.active)) {
              console.log("[STATE-FIX] Team active but no personnel marked active - correcting personnel");
              correctedState.scp087.personnel = currentState.scp087.personnel.map(p => ({
                ...p,
                active: true,
                assignedDClass: Math.ceil(currentState.dClassInventory.assigned / currentState.scp087.personnel.length)
              }));
              needsCorrection = true;
            }

            // Rule 4: If team not active but personnel are marked active, fix personnel
            if (!currentState.scp087.teamActive && currentState.scp087.personnel.some(p => p.active)) {
              console.log("[STATE-FIX] Team inactive but personnel marked active - correcting personnel");
              correctedState.scp087.personnel = currentState.scp087.personnel.map(p => ({
                ...p,
                active: false,
                assignedDClass: 0
              }));
              needsCorrection = true;
            }

            if (needsCorrection) {
              set(correctedState);
              addDClassEvent("System auto-corrected team deployment status inconsistencies", 'info', 'SCP-087');
            }

            return get(); // Return corrected state
          };

          // Apply corrections before proceeding
          const correctedState = validateAndFixStates();
          const newTeamActive = !correctedState.scp087.teamActive;
          
          console.log(`[DEBUG] Toggle team exploration: ${correctedState.scp087.teamActive} -> ${newTeamActive}`);
          
          if (newTeamActive) {
            // Deploying team - require minimum D-Class
            const requiredDClass = 4; // Minimum team requirement
            
            if (correctedState.dClassInventory.count < requiredDClass) {
              addDClassEvent(`Deployment failed - need ${requiredDClass} D-Class for exploration team (have ${correctedState.dClassInventory.count})`, 'warning', 'SCP-087');
              return;
            }
            
            // Consume D-Class for deployment
            set((state) => ({
              ...state,
              dClassInventory: {
                ...state.dClassInventory,
                count: state.dClassInventory.count - requiredDClass,
                assigned: state.dClassInventory.assigned + requiredDClass
              },
              scp087: {
                ...state.scp087,
                teamActive: true,
                teamDeployed: true, // Always sync these states
                personnel: state.scp087.personnel.map(p => ({
                  ...p,
                  active: true,
                  assignedDClass: Math.ceil(requiredDClass / state.scp087.personnel.length)
                }))
              }
            }));
            
            addDClassEvent(`${requiredDClass} D-Class deployed to SCP-087 exploration teams`, 'critical', 'SCP-087');
            console.log(`[DEBUG] Team deployed - Active: true, Deployed: true, Assigned D-Class: ${requiredDClass}`);
          } else {
            // Recalling team - return surviving D-Class
            const survivingDClass = correctedState.dClassInventory.assigned;
            
            set((state) => ({
              ...state,
              dClassInventory: {
                ...state.dClassInventory,
                count: state.dClassInventory.count + survivingDClass,
                assigned: 0
              },
              scp087: {
                ...state.scp087,
                teamActive: false,
                teamDeployed: false, // Always sync these states
                personnel: state.scp087.personnel.map(p => ({
                  ...p,
                  active: false,
                  assignedDClass: 0
                }))
              }
            }));
            
            addDClassEvent(`Exploration teams recalled - ${survivingDClass} D-Class returned to holding`, 'warning', 'SCP-087');
            console.log(`[DEBUG] Team recalled - Active: false, Deployed: false, Returned D-Class: ${survivingDClass}`);
          }

          // Final validation after state change
          setTimeout(() => validateAndFixStates(), 100);
        },

        upgradePersonnel: (personnelId: string, upgradeType: string) => {
          const state = get();
          
          // Safety check - ensure personnel exists
          if (!state.scp087.personnel || !Array.isArray(state.scp087.personnel)) {
            console.error("Personnel not initialized, cannot upgrade");
            return;
          }
          
          const personnel = state.scp087.personnel.find(p => p.id === personnelId);
          if (!personnel) return;

          const costs = {
            level: 50 + (personnel.level * 25),
            survival: Math.round(40 + (personnel.survivalRate * 50))
          };

          const cost = costs[upgradeType as keyof typeof costs];
          if (!cost || state.scp087.paranoiaEnergy < cost) return;

          set((state) => ({
            ...state,
            scp087: {
              ...state.scp087,
              paranoiaEnergy: state.scp087.paranoiaEnergy - cost,
              personnel: state.scp087.personnel.map(p => {
                if (p.id !== personnelId) return p;
                
                switch (upgradeType) {
                  case 'level':
                    return { ...p, level: p.level + 1, experience: 0 };
                  case 'survival':
                    return { ...p, survivalRate: Math.min(0.99, p.survivalRate + 0.05) };
                  default:
                    return p;
                }
              })
            }
          }));
        },

        replacePersonnel: (personnelId: string) => {
          const state = get();
          const cost = 100;
          if (state.scp087.paranoiaEnergy < cost) return;
          
          // Safety check - ensure personnel exists
          if (!state.scp087.personnel || !Array.isArray(state.scp087.personnel)) {
            console.error("Personnel not initialized, cannot replace");
            return;
          }

          const roles = ["Scout", "Research", "Handler"] as const;
          const names = {
            Scout: ["Agent Delta", "Scout Alpha", "Operative Beta"],
            Research: ["Dr. Chen", "Tech Analyst", "Research Lead"],
            Handler: ["Handler Prime", "Safety Officer", "Team Leader"]
          };

          set((state) => ({
            ...state,
            scp087: {
              ...state.scp087,
              paranoiaEnergy: state.scp087.paranoiaEnergy - cost,
              personnel: state.scp087.personnel.map(p => {
                if (p.id !== personnelId) return p;
                
                const role = p.role;
                const nameList = names[role];
                const newName = nameList[Math.floor(Math.random() * nameList.length)];
                
                return {
                  ...p,
                  name: newName,
                  level: 1,
                  experience: 0,
                  speed: role === "Scout" ? 1.2 : role === "Research" ? 0.8 : 1.0,
                  survivalRate: role === "Scout" ? 0.9 : role === "Research" ? 0.7 : 0.95,
                  status: "active" as const
                };
              })
            }
          }));
        },

        purchaseSCP087Upgrade: (upgradeId: string) => {
          const state = get();
          const upgrade = state.scp087.upgrades[upgradeId];
          
          if (!upgrade || state.scp087.paranoiaEnergy < upgrade.cost) return;
          
          // Check unlock conditions
          if (upgrade.unlockCondition) {
            const requiredUpgrade = state.scp087.upgrades[upgrade.unlockCondition.upgradeId];
            if (!requiredUpgrade || requiredUpgrade.owned < upgrade.unlockCondition.level) {
              return;
            }
          }
          
          // Check max level
          if (upgrade.maxLevel && upgrade.owned >= upgrade.maxLevel) return;
          
          // Calculate new cost using tier-based scaling (based on Clicker Heroes/Cookie Clicker)
          const calculateNewCost = (currentLevel: number, baseUpgrade: Upgrade) => {
            const nextLevel = currentLevel + 1;
            let multiplier: number;
            
            switch (baseUpgrade.tier) {
              case 'equipment':
                // Clicker Heroes style - frequent purchases
                multiplier = 1.07;
                break;
              case 'personnel':
                // Cookie Clicker style - medium purchases
                multiplier = 1.15;
                break;
              case 'research':
                // Steeper scaling for expensive research
                multiplier = 1.20;
                break;
              case 'facility':
                // Very steep scaling for end-game upgrades
                multiplier = 1.25;
                break;
              default:
                multiplier = 1.15;
            }
            
            // Apply progressive cost formula
            return Math.floor((baseUpgrade.baseCost || baseUpgrade.cost) * Math.pow(multiplier, nextLevel - 1));
          };
          
          set((state) => {
            const newLevel = upgrade.owned + 1;
            const newCost = calculateNewCost(upgrade.owned, upgrade);
            
            const newState = {
              ...state,
              scp087: {
                ...state.scp087,
                paranoiaEnergy: state.scp087.paranoiaEnergy - upgrade.cost,
                upgrades: {
                  ...state.scp087.upgrades,
                  [upgradeId]: {
                    ...upgrade,
                    owned: newLevel,
                    cost: newCost
                  }
                }
              }
            };
            
            // Apply upgrade effects with scaling and synergies
            if (upgradeId === 'advancedBattery') {
              const efficiencyBonus = newLevel * 0.01; // +1% per level
              const baseDrainRate = 6;
              const baseCapacity = 100;
              
              // Check for synergy bonuses
              const tacticalModules = state.scp087.upgrades['tacticalModules']?.owned || 0;
              const synergyBonus = tacticalModules > 0 ? 1 + (tacticalModules * 0.05) : 1;
              
              newState.scp087.flashlight = {
                ...newState.scp087.flashlight,
                capacity: Math.floor(baseCapacity * (1 + efficiencyBonus) * synergyBonus),
                drainPerSec: Math.max(0.5, baseDrainRate * (1 - efficiencyBonus) / synergyBonus)
              };
            }
            
            // Apply milestone bonuses
            const milestones = upgrade.milestones || [];
            if (milestones.includes(newLevel)) {
              // Trigger milestone bonus (could add special effects here)
              console.log(`Milestone reached for ${upgrade.name} at level ${newLevel}!`);
            }
            
            return newState;
          });
        },

        rechargeFlashlight: () => {
          const state = get();
          if (state.scp087.flashlightRecharging) return;
          
          set((state) => ({
            scp087: {
              ...state.scp087,
              flashlightRecharging: true
            }
          }));
          
          // Recharge over 3 seconds
          setTimeout(() => {
            set((state) => ({
              scp087: {
                ...state.scp087,
                flashlightBattery: 100,
                flashlightRecharging: false
              }
            }));
          }, 3000);
        },

        // New SCP-087 Actions for Terminal v2.1
        toggleFlashlight: () => {
          set((state) => {
            // Safety check - ensure flashlight exists
            if (!state.scp087.flashlight) {
              console.error("Flashlight not initialized, resetting to default");
              return {
                ...state,
                scp087: {
                  ...state.scp087,
                  flashlight: {
                    on: true,
                    charge: 100,
                    capacity: 100,
                    drainPerSec: 6,
                    rechargePerSec: 22,
                    lowThreshold: 20,
                  }
                }
              };
            }
            
            return {
              scp087: {
                ...state.scp087,
                flashlight: {
                  ...state.scp087.flashlight,
                  on: !state.scp087.flashlight.on
                }
              }
            };
          });
        },

        drainFlashlight: (dt: number) => {
          set((state) => {
            // Safety check - ensure flashlight exists
            if (!state.scp087.flashlight) {
              return state;
            }
            
            const f = state.scp087.flashlight;
            if (!f.on) return state;
            
            const newCharge = Math.max(0, f.charge - f.drainPerSec * dt);
            return {
              ...state,
              scp087: {
                ...state.scp087,
                flashlight: {
                  ...f,
                  charge: newCharge
                },
                flashlightBattery: newCharge // sync legacy field
              }
            };
          });
        },

        // Auto-recharge only (passive from upgrade)
        rechargeFlashlightV2: (dt: number) => {
          set((state) => {
            // Safety check - ensure flashlight exists
            if (!state.scp087.flashlight) {
              return state;
            }

            const f = state.scp087.flashlight;
            
            // Calculate recharge rate from auto-recharge upgrade
            const autoRechargeUpgrade = state.scp087.upgrades.autoRecharge;
            const baseRate = autoRechargeUpgrade ? autoRechargeUpgrade.effect : 0;
            const upgradeLevel = autoRechargeUpgrade ? autoRechargeUpgrade.owned : 0;
            const rechargeRate = upgradeLevel > 0 ? baseRate + ((upgradeLevel - 1) * 5) : 0;
            
            const newCharge = Math.min(f.capacity, f.charge + rechargeRate * dt);
            return {
              ...state,
              scp087: {
                ...state.scp087,
                flashlight: {
                  ...f,
                  charge: newCharge
                },
                flashlightBattery: newCharge // sync legacy field
              }
            };
          });
        },

        // Manual charge (immediate, always works)
        manualChargeFlashlight: () => {
          set((state) => {
            // Safety check - ensure flashlight exists
            if (!state.scp087.flashlight) {
              return state;
            }

            const f = state.scp087.flashlight;
            const chargeAmount = 15; // Fixed manual charge amount
            const newCharge = Math.min(f.capacity, f.charge + chargeAmount);
            
            return {
              ...state,
              scp087: {
                ...state.scp087,
                flashlight: {
                  ...f,
                  charge: newCharge
                },
                flashlightBattery: newCharge // sync legacy field
              }
            };
          });
        },

        movePersonnel: (dt: number) => {
          set((state) => {
            // Safety check - ensure personnel and flashlight exist
            if (!state.scp087.teamActive || !state.scp087.personnel || !state.scp087.flashlight) return state;
            
            const baseSpeed = 5 * (state.scp087.flashlight.on ? 1 : 0.6);
            const { addDClassEvent } = get();
            
            const newPersonnel = state.scp087.personnel.map(p => {
              if (!p.active) return p;
              
              // Check for blocking encounters at personnel's current depth
              const blockingEncounter = state.scp087.activeEncounters.find(e => 
                e.blocking && 
                !e.inProgress && 
                Math.abs(e.absoluteDepth - p.absoluteDepth) < 25 // 25m range
              );
              
              if (blockingEncounter && p.status !== "blocked") {
                // Personnel hit a blocking encounter
                addDClassEvent(`${p.name} halted at ${Math.round(blockingEncounter.absoluteDepth)}m - ${blockingEncounter.kind === "087-1" ? "SCP-087-1 manifestation" : "anomalous reading"} requires investigation`, 'warning', 'SCP-087');
                return {
                  ...p,
                  status: "blocked" as const,
                  blockedBy: blockingEncounter.id
                };
              }
              
              // If blocked, don't move
              if (p.status === "blocked") {
                // Check if blocking encounter is resolved
                const stillBlocked = state.scp087.activeEncounters.find(e => e.id === p.blockedBy);
                if (!stillBlocked) {
                  // Encounter resolved, resume movement
                  addDClassEvent(`${p.name} resuming descent from ${Math.round(p.absoluteDepth)}m - obstruction cleared`, 'info', 'SCP-087');
                  return {
                    ...p,
                    status: "active" as const,
                    blockedBy: undefined
                  };
                }
                return p; // Stay blocked
              }
              
              // Normal movement
              const personnelSpeed = baseSpeed;
              return {
                ...p,
                absoluteDepth: p.absoluteDepth + personnelSpeed * dt,
                experience: p.experience + (personnelSpeed * dt * 0.1)
              };
            });
            
            // Update player depth to follow team center (average depth of active personnel)
            const activePersonnel = newPersonnel.filter(p => p.active && p.status !== "blocked");
            const avgDepth = activePersonnel.length > 0 
              ? activePersonnel.reduce((sum, p) => sum + p.absoluteDepth, 0) / activePersonnel.length
              : Math.max(...newPersonnel.map(p => p.absoluteDepth));
            
            return {
              ...state,
              scp087: {
                ...state.scp087,
                personnel: newPersonnel,
                currentDepth: avgDepth,
                depth: avgDepth
              }
            };
          });
        },

        spawnEncounterAtDepth: (absoluteDepth: number, kind: EncounterKind) => {
          set((state) => ({
            scp087: {
              ...state.scp087,
              activeEncounters: [
                ...state.scp087.activeEncounters,
                {
                  id: crypto.randomUUID(),
                  x: 0, y: 0, // runtime overlay mapping fills these
                  kind,
                  absoluteDepth,
                  rewardPE: kind === "087-1" ? 200 + Math.floor(absoluteDepth / 100) * 50 : 40 + Math.floor(absoluteDepth / 200) * 20,
                  expiresAt: Date.now() + (kind === "087-1" ? 15000 : 12000),
                  blocking: true, // all encounters block progression
                  inProgress: false,
                  duration: kind === "087-1" ? 45000 + Math.floor(absoluteDepth / 100) * 15000 : 20000 + Math.floor(absoluteDepth / 200) * 10000,
                  casualtyRate: kind === "087-1" ? 0.6 + (absoluteDepth / 1000) * 0.25 : 0.15 + (absoluteDepth / 1000) * 0.1,
                  requiredDClass: kind === "087-1" ? Math.max(2, Math.floor(absoluteDepth / 300) + 2) : Math.max(1, Math.floor(absoluteDepth / 500) + 1)
                }
              ]
            }
          }));
        },

        resolveEncounter: (id: string) => {
          set((state) => {
            const encounterIndex = state.scp087.activeEncounters.findIndex(e => e.id === id);
            if (encounterIndex < 0) return state;
            
            const encounter = state.scp087.activeEncounters[encounterIndex];
            
            // Calculate bonuses from personnel (with safety checks)
            const personnel = state.scp087.personnel || [];
            const scouts = personnel.filter(p => p.role === "Scout");
            const scoutPEBonus = scouts.reduce((total, scout) => total + (scout.level * 0.1), 0); // +10% PE per scout level

            // Add PE reward with scout bonus
            const basePE = encounter.rewardPE;
            const bonusPE = basePE * scoutPEBonus;
            const totalPE = Math.round(basePE + bonusPE);
            
            // Generate event based on encounter type
            const { addDClassEvent } = get();
            if (encounter.kind === "087-1") {
              addDClassEvent(`SCP-087-1 encounter resolved at ${Math.round(encounter.absoluteDepth)}m - Subject extraction successful`, 'warning', 'SCP-087');
            } else {
              addDClassEvent(`Anomalous event documented at ${Math.round(encounter.absoluteDepth)}m - Research data recovered`, 'info', 'SCP-087');
            }
            
            const newEncounters = [...state.scp087.activeEncounters];
            newEncounters.splice(encounterIndex, 1);
            
            return {
              ...state,
              scp087: {
                ...state.scp087,
                paranoiaEnergy: state.scp087.paranoiaEnergy + totalPE,
                currentDepth: encounter.kind === "087-1" 
                  ? Math.max(0, state.scp087.currentDepth - 13)
                  : state.scp087.currentDepth,
                depth: encounter.kind === "087-1"
                  ? Math.max(0, state.scp087.depth - 13)
                  : state.scp087.depth,
                activeEncounters: newEncounters
              }
            };
          });
        },

        cullExpiredEncounters: () => {
          set((state) => {
            const now = Date.now();
            const { addDClassEvent } = get();
            const expiredEncounters = state.scp087.activeEncounters.filter(e => e.expiresAt <= now);
            const validEncounters = state.scp087.activeEncounters.filter(e => e.expiresAt > now);
            
            // Generate events for expired encounters
            expiredEncounters.forEach(e => {
              if (e.kind === "087-1") {
                addDClassEvent(`SCP-087-1 manifestation dissipated at ${Math.round(e.absoluteDepth)}m - investigation opportunity lost`, 'warning', 'SCP-087');
              } else {
                addDClassEvent(`Anomalous readings stabilized at ${Math.round(e.absoluteDepth)}m - collection window closed`, 'info', 'SCP-087');
              }
            });
            
            if (validEncounters.length === state.scp087.activeEncounters.length) return state;
            
            return {
              ...state,
              scp087: {
                ...state.scp087,
                activeEncounters: validEncounters
              }
            };
          });
        },

        // Encounter interaction actions  
        startEncounterInteraction: (encounterId: string) => {
          const state = get();
          const encounter = state.scp087.activeEncounters.find(e => e.id === encounterId);
          if (!encounter || encounter.inProgress) return false;

          const { addDClassEvent } = get();
          const requiredDClass = encounter.requiredDClass || 1;
          
          if (state.dClassInventory.count < requiredDClass) {
            addDClassEvent(`Insufficient D-Class for ${encounter.kind === "087-1" ? "investigation" : "collection"} - need ${requiredDClass}`, 'warning', 'SCP-087');
            return false;
          }

          set((state) => ({
            ...state,
            dClassInventory: {
              ...state.dClassInventory,
              count: state.dClassInventory.count - requiredDClass,
              assigned: state.dClassInventory.assigned + requiredDClass
            },
            scp087: {
              ...state.scp087,
              activeEncounters: state.scp087.activeEncounters.map(e => 
                e.id === encounterId ? { ...e, inProgress: true, progressStarted: Date.now() } : e
              )
            }
          }));

          addDClassEvent(`${requiredDClass} D-Class deployed for ${encounter.kind === "087-1" ? "investigation" : "collection"} at ${Math.round(encounter.absoluteDepth)}m`, encounter.kind === "087-1" ? 'critical' : 'info', 'SCP-087');
          return true;
        },

        updateEncounterProgress: () => {
          set((state) => {
            const now = Date.now();
            const { processDClassCasualties, addDClassEvent } = get();
            
            // Safety check: ensure activeEncounters exists and is an array
            if (!state.scp087?.activeEncounters || !Array.isArray(state.scp087.activeEncounters)) {
              console.warn('activeEncounters is undefined or not an array, skipping update');
              return state;
            }
            
            const updatedEncounters = state.scp087.activeEncounters.map(encounter => {
              if (!encounter.inProgress || !encounter.progressStarted || !encounter.duration) return encounter;

              const elapsed = now - encounter.progressStarted;
              const progress = elapsed / encounter.duration;
              
              // Generate progressive danger events during long investigations
              if (encounter.kind === "087-1" && progress > 0.3 && progress < 0.9 && Math.random() < 0.1) {
                const progressEvents = [
                  `D-Class report hostile entity manifestation during investigation at ${Math.round(encounter.absoluteDepth)}m`,
                  `Equipment failure cascade - multiple systems offline during encounter at ${Math.round(encounter.absoluteDepth)}m`,
                  `Subject psychological breakdown reported during SCP-087-1 investigation at ${Math.round(encounter.absoluteDepth)}m`,
                  `Emergency protocols activated - investigation team requesting immediate extraction at ${Math.round(encounter.absoluteDepth)}m`
                ];
                
                const randomEvent = progressEvents[Math.floor(Math.random() * progressEvents.length)];
                addDClassEvent(randomEvent, 'critical', 'SCP-087');
              }
              
              // Process casualties during investigation (higher chance for red encounters)
              if (progress > 0.5 && Math.random() < (encounter.casualtyRate || 0) * 0.5) {
                const casualties = Math.min(encounter.requiredDClass || 1, 1);
                console.log(`[DEBUG] Encounter casualty during progress - casualties: ${casualties}, encounter: ${encounter.kind}`);
                processDClassCasualties(casualties);
                
                addDClassEvent(`${casualties} D-Class casualties during ${encounter.kind === "087-1" ? "investigation" : "collection"} at ${Math.round(encounter.absoluteDepth)}m`, 'critical', 'SCP-087');
              }
              
              if (elapsed >= encounter.duration) {
                // Complete encounter with final casualty check
                const finalCasualties = Math.random() < (encounter.casualtyRate || 0) ? 1 : 0;
                if (finalCasualties > 0) {
                  console.log(`[DEBUG] Final encounter casualty - casualties: ${finalCasualties}, encounter: ${encounter.kind}`);
                  processDClassCasualties(finalCasualties);
                  addDClassEvent(`Final casualty during encounter completion at ${Math.round(encounter.absoluteDepth)}m`, 'critical', 'SCP-087');
                }
                
                const finalReward = Math.floor(encounter.rewardPE * (1 + encounter.absoluteDepth / 1000));
                
                set((prevState) => ({
                  ...prevState,
                  scp087: {
                    ...prevState.scp087,
                    paranoiaEnergy: prevState.scp087.paranoiaEnergy + finalReward
                  }
                }));

                addDClassEvent(`${encounter.kind === "087-1" ? "Investigation" : "Collection"} completed at ${Math.round(encounter.absoluteDepth)}m - ${finalReward}PE gained`, encounter.kind === "087-1" ? 'warning' : 'info', 'SCP-087');
                return null; // Remove completed encounter
              }
              return encounter;
            }).filter(e => e !== null);

            if (updatedEncounters.length !== state.scp087.activeEncounters.length) {
              return {
                ...state,
                scp087: {
                  ...state.scp087,
                  activeEncounters: updatedEncounters
                }
              };
            }
            return state;
          });
        },

        abortEncounter: (encounterId: string) => {
          const state = get();
          const encounter = state.scp087.activeEncounters.find(e => e.id === encounterId);
          if (!encounter || !encounter.inProgress) return;

          const { addDClassEvent } = get();
          const assignedDClass = encounter.requiredDClass || 1;
          
          set((state) => ({
            ...state,
            dClassInventory: {
              ...state.dClassInventory,
              count: state.dClassInventory.count + assignedDClass,
              assigned: state.dClassInventory.assigned - assignedDClass
            },
            scp087: {
              ...state.scp087,
              activeEncounters: state.scp087.activeEncounters.filter(e => e.id !== encounterId)
            }
          }));

          addDClassEvent(`Operation aborted at ${Math.round(encounter.absoluteDepth)}m - D-Class extracted`, 'warning', 'SCP-087');
        },

        // D-Class Management Actions
        recruitDClass: (quantity: number) => {
          const state = get();
          const singleCost = 50 + (state.dClassInventory.count * 10);
          const totalCost = quantity === 1 
            ? singleCost 
            : Math.floor(singleCost * quantity * 0.8); // 20% bulk discount for 5+

          if (state.facility.containmentPoints < totalCost) return;
          if (state.dClassInventory.count + quantity > state.dClassInventory.capacity) return;

          set((state) => ({
            ...state,
            facility: {
              ...state.facility,
              containmentPoints: state.facility.containmentPoints - totalCost
            },
            dClassInventory: {
              ...state.dClassInventory,
              count: state.dClassInventory.count + quantity,
              totalRecruitments: state.dClassInventory.totalRecruitments + quantity
            }
          }));
        },

        assignDClass: (scpId: string, quantity: number) => {
          const state = get();
          if (state.dClassInventory.count < quantity) return;

          set((state) => ({
            ...state,
            dClassInventory: {
              ...state.dClassInventory,
              count: state.dClassInventory.count - quantity,
              assigned: state.dClassInventory.assigned + quantity
            }
          }));
        },

        processDClassCasualties: (casualties: number) => {
          const state = get();
          const { addDClassEvent } = get();
          
          console.log(`[DEBUG] Processing ${casualties} D-Class casualties. Current assigned: ${state.dClassInventory.assigned}, count: ${state.dClassInventory.count}`);
          
          // Safety check - don't process if no casualties or no assigned D-Class
          if (casualties <= 0 || state.dClassInventory.assigned <= 0) {
            console.log(`[DEBUG] Skipping casualty processing - casualties: ${casualties}, assigned: ${state.dClassInventory.assigned}`);
            return;
          }
          
          // Limit casualties to available assigned D-Class
          const actualCasualties = Math.min(casualties, state.dClassInventory.assigned);
          console.log(`[DEBUG] Actual casualties to process: ${actualCasualties}`);
          
          // Generate casualty events
          for (let i = 0; i < actualCasualties; i++) {
            const events = [
              "D-{id} reported 'massive face in darkness' before signal lost at {depth}m",
              "D-{id}'s flashlight failed at {depth}m. Subject abandoned mission, whereabouts unknown",
              "D-{id} began screaming incoherently at {depth}m. Terminated own radio contact",
              "Stairwell collapse detected at {depth}m. D-{id} presumed crushed",
              "Reality distortion event at {depth}m. D-{id} timeline divergence confirmed",
              "D-{id} encountered SCP-087-1 at {depth}m. No response to radio contact",
              "Temperature anomaly at {depth}m. D-{id}'s thermal signature disappeared",
              "D-{id} reported 'stairs going up now' at {depth}m. GPS shows continued descent",
              "Audio feed from D-{id} at {depth}m contained only child crying. Signal terminated",
              "D-{id} vital signs flatlined at {depth}m. Body recovery impossible"
            ];
            
            const randomEvent = events[Math.floor(Math.random() * events.length)];
            const dClassId = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
            const depth = Math.floor(Math.random() * 1000) + 100;
            
            const message = randomEvent
              .replace('{id}', dClassId)
              .replace('{depth}', depth.toString());
              
            addDClassEvent(message, 'critical', 'SCP-087');
          }
          
          // Update D-Class inventory - reduce assigned count and track casualties
          set((state) => ({
            ...state,
            dClassInventory: {
              ...state.dClassInventory,
              assigned: Math.max(0, state.dClassInventory.assigned - actualCasualties),
              totalCasualties: state.dClassInventory.totalCasualties + actualCasualties
            }
          }));
          
          console.log(`[DEBUG] Casualties processed. New assigned: ${get().dClassInventory.assigned}, total casualties: ${get().dClassInventory.totalCasualties}`);
        },

        upgradeDClassFacility: (upgradeType: "capacity" | "generation" | "survival") => {
          const state = get();
          const upgrade = state.dClassFacilityUpgrades[upgradeType];
          
          if (state.facility.containmentPoints < upgrade.cost) return;

          set((state) => {
            const newState = {
              ...state,
              facility: {
                ...state.facility,
                containmentPoints: state.facility.containmentPoints - upgrade.cost
              },
              dClassFacilityUpgrades: {
                ...state.dClassFacilityUpgrades,
                [upgradeType]: {
                  cost: Math.floor(upgrade.cost * 1.5), // 50% cost increase per level
                  level: upgrade.level + 1
                }
              }
            };

            // Apply upgrade effects
            switch (upgradeType) {
              case "capacity":
                newState.dClassInventory = {
                  ...state.dClassInventory,
                  capacity: state.dClassInventory.capacity + 50
                };
                break;
              case "generation":
                newState.dClassInventory = {
                  ...state.dClassInventory,
                  generationRate: state.dClassInventory.generationRate + 0.5
                };
                break;
              case "survival":
                newState.dClassInventory = {
                  ...state.dClassInventory,
                  mortalityRate: Math.max(0.1, state.dClassInventory.mortalityRate - 0.05)
                };
                break;
            }

            return newState;
          });
        },

        addDClassEvent: (message: string, severity: 'info' | 'warning' | 'critical' = 'info', scpId?: string) => {
          set((state) => {
            const newEvent: DClassEvent = {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              message,
              severity,
              scpId
            };

            // Keep only the last 50 events to prevent memory bloat
            const events = [...state.dClassEvents, newEvent];
            const trimmedEvents = events.slice(-50);

            return {
              ...state,
              dClassEvents: trimmedEvents
            };
          });
        },

        // SCP-173 Actions
        blink: () => {
          set((state) => ({
            scp173: {
              ...state.scp173,
              blinkMeter: 0
            }
          }));
        },

        // SCP-999 Actions
        feedCandy: () => {
          const state = get();
          if (state.scp999.candyStock <= 0) return;
          
          const orbGain = 5 * state.scp999.happinessMultiplier;
          
          set((state) => ({
            scp999: {
              ...state.scp999,
              candyStock: state.scp999.candyStock - 1,
              euphoriaOrbs: state.scp999.euphoriaOrbs + orbGain,
              activeBuffs: [
                ...state.scp999.activeBuffs,
                { type: 'happiness', duration: 30, multiplier: 1.2 }
              ]
            }
          }));
        },

        // Add periodic state validation in tick
        validateTeamStates: () => {
          const state = get();
          let needsCorrection = false;
          let corrections = [];

          // Check if teamActive and teamDeployed are in sync
          if (state.scp087.teamActive !== state.scp087.teamDeployed) {
            corrections.push(`teamActive/teamDeployed sync (${state.scp087.teamActive}/${state.scp087.teamDeployed})`);
            needsCorrection = true;
          }

          // Check if assigned D-Class matches team status
          if (state.dClassInventory.assigned === 0 && state.scp087.teamActive) {
            corrections.push("no assigned D-Class but team active");
            needsCorrection = true;
          }

          if (state.dClassInventory.assigned > 0 && !state.scp087.teamActive) {
            corrections.push("assigned D-Class but team inactive");
            needsCorrection = true;
          }

          if (needsCorrection) {
            console.log(`[STATE-VALIDATION] Corrections needed: ${corrections.join(', ')}`);
            
            // Apply corrections
            const shouldBeActive = state.dClassInventory.assigned > 0;
            
            set((prevState) => ({
              ...prevState,
              scp087: {
                ...prevState.scp087,
                teamActive: shouldBeActive,
                teamDeployed: shouldBeActive,
                personnel: prevState.scp087.personnel.map(p => ({
                  ...p,
                  active: shouldBeActive,
                  assignedDClass: shouldBeActive ? Math.ceil(prevState.dClassInventory.assigned / prevState.scp087.personnel.length) : 0
                }))
              }
            }));

            get().addDClassEvent(`System corrected team status inconsistencies: ${corrections.join(', ')}`, 'info', 'SCP-087');
          }
        },
        tick: () => {
          const state = get();
          
          // Validate team states every tick
          get().validateTeamStates();
          
          set((prevState) => {
            const newState = { ...prevState };
            
            // Calculate research personnel bonuses (with safety checks)
            const personnel = newState.scp087.personnel || [];
            const researchers = personnel.filter(p => p.role === "Research");
            const researchIdleBonus = researchers.reduce((total, researcher) => total + (researcher.level * 0.15), 0); // +15% idle PE per research level
            
            // SCP-087 auto descend with research bonus
            if (newState.scp087.autoDescend && newState.scp087.upgrades.team.owned > 0) {
              const autoEnergyGain = Math.floor(newState.scp087.currentDepth * 0.1 * newState.scp087.upgrades.team.owned);
              const bonusEnergyGain = autoEnergyGain * researchIdleBonus;
              newState.scp087.paranoiaEnergy += autoEnergyGain + bonusEnergyGain;
              newState.scp087.currentDepth += newState.scp087.upgrades.team.owned;
            }
            
            // Generate idle research points (base rate + research bonus)
            const baseResearchRate = 0.1;
            const totalResearchRate = baseResearchRate * (1 + researchIdleBonus);
            newState.facility.researchPoints += totalResearchRate;

            // D-Class auto-generation
            const autoGenRate = newState.dClassInventory.generationRate / 60; // per second
            if (newState.dClassInventory.count < newState.dClassInventory.capacity) {
              newState.dClassInventory.count = Math.min(
                newState.dClassInventory.capacity,
                newState.dClassInventory.count + autoGenRate
              );
            }

            // Enhanced SCP-087 encounter spawning and activity
            if (newState.scp087.teamActive && newState.scp087.personnel) {
              // Ensure activeEncounters is initialized
              if (!newState.scp087.activeEncounters || !Array.isArray(newState.scp087.activeEncounters)) {
                newState.scp087.activeEncounters = [];
              }
              
              const currentDepth = newState.scp087.currentDepth || 0;
              const { spawnEncounterAtDepth, addDClassEvent, cullExpiredEncounters, updateEncounterProgress, movePersonnel } = get();
              
              // Dynamic spawn rates based on depth and activity
              let anomalySpawnChance = 0.05; // 5% base per tick
              let scpSpawnChance = 0.01; // 1% base per tick for SCP-087-1
              
              // Increase spawn rates with depth
              const depthMultiplier = 1 + (currentDepth / 600) * 0.8;
              anomalySpawnChance *= depthMultiplier;
              scpSpawnChance *= depthMultiplier;
              
              // Milestone events at specific depths (every 150m)
              const nearMilestone = (currentDepth % 150) < 25;
              if (nearMilestone) {
                anomalySpawnChance *= 3;
                scpSpawnChance *= 2.5;
              }
              
              // Limit concurrent encounters
              const maxEncounters = 4;
              const currentEncounters = newState.scp087.activeEncounters.length;
              
              // Spawn encounters
              if (currentEncounters < maxEncounters) {
                if (Math.random() < anomalySpawnChance) {
                  const spawnDepth = currentDepth + (Math.random() * 100) + 30;
                  spawnEncounterAtDepth(spawnDepth, "anomaly");
                  addDClassEvent(`Anomalous readings detected ${Math.round(spawnDepth - currentDepth)}m ahead at ${Math.round(spawnDepth)}m depth`, 'info', 'SCP-087');
                }
                
                if (Math.random() < scpSpawnChance) {
                  const spawnDepth = currentDepth + (Math.random() * 150) + 60;
                  spawnEncounterAtDepth(spawnDepth, "087-1");
                  addDClassEvent(`Motion detected on lower levels - potential SCP-087-1 manifestation at ${Math.round(spawnDepth)}m`, 'warning', 'SCP-087');
                }
              }
              
              // Process encounters and movement
              cullExpiredEncounters();
              updateEncounterProgress();
              movePersonnel(1);
              
              // Exploration events during active missions (25% chance per tick)
              if (Math.random() < 0.25) {
                const explorationEvents = [
                  `Team reports increasing paranormal activity at ${Math.round(currentDepth)}m`,
                  `Temperature dropping rapidly - thermal readings unstable at ${Math.round(currentDepth)}m`,
                  `Audio distortions detected on D-Class radio feeds at ${Math.round(currentDepth)}m`,
                  `Structural anomalies reported - stairwell geometry inconsistent at ${Math.round(currentDepth)}m`,
                  `D-Class psychological evaluations showing elevated stress at ${Math.round(currentDepth)}m`,
                  `Equipment malfunctions increasing - multiple flashlight failures at ${Math.round(currentDepth)}m`,
                  `Unexplained echoes and sounds reported from deeper sections near ${Math.round(currentDepth)}m`,
                  `Time dilation effects suspected - chronometer synchronization lost at ${Math.round(currentDepth)}m`
                ];
                
                const randomEvent = explorationEvents[Math.floor(Math.random() * explorationEvents.length)];
                addDClassEvent(randomEvent, currentDepth > 600 ? 'warning' : 'info', 'SCP-087');
              }
            }

            // Generate procedural D-Class events occasionally
            if (Math.random() < 0.06) { // 6% chance per tick for more activity
              const { addDClassEvent } = get();
              const atmosphericEvents = [
                "New D-Class personnel batch delivered from Site-17",
                "D-Class psychological evaluation protocols updated",
                "Monthly amnesiacs distribution completed",
                "D-Class housing wing sanitation in progress",
                "Security sweep of D-Class quarters completed - no contraband found",
                "D-Class meal provision systems functioning nominally",
                "Automated D-Class interview protocols initiated",
                "D-Class medical examinations scheduled for next rotation",
                "Foundation Ethics Committee review of D-Class protocols pending",
                "Site-19 security alert - D-Class containment protocols reinforced",
                "D-Class work assignment optimization protocols updated",
                "Foundation personnel rotation affecting D-Class supervision schedules",
                "Psychological conditioning session completed for new D-Class subjects"
              ];
              
              const randomMessage = atmosphericEvents[Math.floor(Math.random() * atmosphericEvents.length)];
              addDClassEvent(randomMessage, 'info');
            }

            // Enhanced D-Class casualty system during active exploration
            if (newState.scp087.teamActive && newState.dClassInventory.assigned > 0) {
              const { processDClassCasualties, addDClassEvent } = get();
              
              // Base casualty rate: 5% per tick (reduced from 8% for more balanced gameplay)
              let casualtyRate = 0.05;
              
              // Apply mortality rate from upgrades
              const mortalityMultiplier = newState.dClassInventory.mortalityRate;
              casualtyRate *= mortalityMultiplier;
              
              // Depth-based escalation - deeper = exponentially more dangerous
              const avgDepth = newState.scp087.currentDepth || 0;
              const depthMultiplier = 1 + (avgDepth / 500) * 0.5; // +50% per 500m (more gradual)
              casualtyRate *= depthMultiplier;
              
              console.log(`[DEBUG] Casualty calculation - Base: 5%, Mortality: ${mortalityMultiplier}, Depth: ${depthMultiplier}, Final: ${casualtyRate * 100}%`);
              
              // Death zones at milestone depths
              const isDeathZone = (avgDepth >= 500 && avgDepth < 520) || 
                                  (avgDepth >= 1000 && avgDepth < 1020) || 
                                  (avgDepth >= 1500 && avgDepth < 1520);
              if (isDeathZone) {
                casualtyRate = 0.15; // 15% guaranteed casualties in death zones (reduced from 25%)
                console.log(`[DEBUG] Death zone detected at ${avgDepth}m - casualty rate increased to 15%`);
              }
              
              // Calculate casualties
              if (Math.random() < casualtyRate) {
                const maxCasualties = Math.min(2, Math.ceil(newState.dClassInventory.assigned * 0.3)); // Max 2 casualties, up to 30% of assigned
                const casualtyCount = Math.ceil(Math.random() * maxCasualties);
                
                console.log(`[DEBUG] Casualty event triggered! Count: ${casualtyCount}, Assigned: ${newState.dClassInventory.assigned}`);
                
                if (isDeathZone) {
                  addDClassEvent(`CRITICAL DEPTH REACHED - Mass casualty event at ${Math.round(avgDepth)}m`, 'critical', 'SCP-087');
                }
                
                processDClassCasualties(casualtyCount);
                
                // Auto-replace D-Class if inventory allows (with improved logic)
                const currentState = get();
                const availableForReplacement = currentState.dClassInventory.count;
                const replacementNeeded = Math.min(casualtyCount, availableForReplacement);
                
                if (replacementNeeded > 0) {
                  set((prevState) => ({
                    ...prevState,
                    dClassInventory: {
                      ...prevState.dClassInventory,
                      count: prevState.dClassInventory.count - replacementNeeded,
                      assigned: prevState.dClassInventory.assigned + replacementNeeded
                    }
                  }));
                  
                  addDClassEvent(`${replacementNeeded} replacement D-Class deployed to maintain exploration teams`, 'info', 'SCP-087');
                  console.log(`[DEBUG] Auto-replaced ${replacementNeeded} D-Class. New assigned: ${get().dClassInventory.assigned}`);
                }
                
                // Emergency recall when too few D-Class remain
                if (currentState.dClassInventory.assigned <= 2 && currentState.dClassInventory.count <= 1) {
                  addDClassEvent("EMERGENCY PROTOCOL - Team automatically recalled due to critical D-Class shortage", 'critical', 'SCP-087');
                  console.log(`[DEBUG] Emergency recall triggered - assigned: ${currentState.dClassInventory.assigned}, count: ${currentState.dClassInventory.count}`);
                  
                  // Emergency recall: Force sync both states to false
                  set((prevState) => ({
                    ...prevState,
                    scp087: {
                      ...prevState.scp087,
                      teamActive: false,
                      teamDeployed: false,
                      personnel: prevState.scp087.personnel.map(p => ({
                        ...p,
                        active: false,
                        assignedDClass: 0
                      }))
                    },
                    dClassInventory: {
                      ...prevState.dClassInventory,
                      count: prevState.dClassInventory.count + prevState.dClassInventory.assigned,
                      assigned: 0
                    }
                  }));
                }
              }
              
              // Continuous atmospheric events during exploration (20% chance per tick)
              if (Math.random() < 0.2) {
                const explorationEvents = [
                  `Team reports increasing paranormal activity at ${Math.round(avgDepth)}m`,
                  `Temperature dropping rapidly - thermal readings unstable at ${Math.round(avgDepth)}m`,
                  `Audio distortions detected on D-Class radio feeds at ${Math.round(avgDepth)}m`,
                  `Structural anomalies reported - stairwell geometry inconsistent at ${Math.round(avgDepth)}m`,
                  `D-Class psychological evaluations showing elevated stress at ${Math.round(avgDepth)}m`,
                  `Equipment malfunctions increasing - multiple flashlight failures at ${Math.round(avgDepth)}m`,
                  `Unexplained echoes and sounds reported from deeper sections near ${Math.round(avgDepth)}m`,
                  `Time dilation effects suspected - chronometer synchronization lost at ${Math.round(avgDepth)}m`
                ];
                
                const randomEvent = explorationEvents[Math.floor(Math.random() * explorationEvents.length)];
                addDClassEvent(randomEvent, avgDepth > 800 ? 'warning' : 'info', 'SCP-087');
              }
            }
            
            // Update personnel positions (legacy)
            if (newState.scp087.oldPersonnel) {
              newState.scp087.oldPersonnel = newState.scp087.oldPersonnel.map(person => ({
                ...person,
                position: person.direction === 'down' 
                  ? person.position + 0.5 
                  : person.position - 0.5
              })).filter(person => person.position >= 0 && person.position < 8);
            }
            
            // Decay flashlight battery slightly over time
            if (newState.scp087.flashlightBattery > 0 && !newState.scp087.flashlightRecharging) {
              newState.scp087.flashlightBattery = Math.max(0, newState.scp087.flashlightBattery - 0.2);
            }
            
            // SCP-173 blink meter
            if (!newState.scp173.breachActive) {
              newState.scp173.blinkMeter = Math.min(100, newState.scp173.blinkMeter + (2 / newState.scp173.guardCount));
              
              // Generate observation points if not breached
              if (newState.scp173.blinkMeter < 100) {
                newState.scp173.observationPoints += Math.floor(1 * newState.scp173.guardCount);
              }
              
              // Check for breach
              if (newState.scp173.blinkMeter >= 100) {
                newState.scp173.breachActive = true;
                newState.scp173.lastBreach = Date.now();
                newState.facility.containmentPoints = Math.max(0, newState.facility.containmentPoints - 10);
              }
            } else {
              // Breach duration (5 seconds)
              if (Date.now() - newState.scp173.lastBreach > 5000) {
                newState.scp173.breachActive = false;
                newState.scp173.blinkMeter = 0;
              }
            }
            
            // SCP-999 candy regeneration and buff processing
            newState.scp999.candyStock = Math.min(20, newState.scp999.candyStock + 0.1);
            newState.scp999.activeBuffs = newState.scp999.activeBuffs
              .map(buff => ({ ...buff, duration: buff.duration - 1 }))
              .filter(buff => buff.duration > 0);
            
            // Calculate happiness multiplier
            const activeHappinessBuffs = newState.scp999.activeBuffs.filter(b => b.type === 'happiness');
            newState.scp999.happinessMultiplier = activeHappinessBuffs.reduce((acc, buff) => acc * buff.multiplier, 1);
            
            // Generate containment points from all sources
            const totalEnergyGeneration = Math.floor(newState.scp087.paranoiaEnergy * 0.01);
            const totalObservationGeneration = Math.floor(newState.scp173.observationPoints * 0.01);
            const totalOrbGeneration = Math.floor(newState.scp999.euphoriaOrbs * 0.01);
            
            newState.facility.containmentPoints += totalEnergyGeneration + totalObservationGeneration + totalOrbGeneration;
            newState.facility.lastSaveTime = Date.now();
            
            return newState;
          });
        },

        startGame: () => {
          set({ gameStarted: true });
          
          // Add initial D-Class system status event
          const { addDClassEvent } = get();
          addDClassEvent("D-Class Management System Online - All containment protocols active", 'info');
        },

        resetFacility: () => {
          const state = get();
          const knowledgeGain = Math.floor(state.facility.containmentPoints / 1000);
          
          // Apply flashlight upgrades to the reset state
          let newState = {
            ...defaultState,
            facility: {
              ...defaultState.facility,
              foundationKnowledge: state.facility.foundationKnowledge + knowledgeGain
            },
            gameStarted: true
          };
          
          // Apply any existing flashlight upgrades
          newState = applyFlashlightUpgrades(newState);
          
          set(newState);
        },

        calculateOfflineProgress: () => {
          const state = get();
          const timeAway = Date.now() - state.facility.lastSaveTime;
          const ticksAway = Math.floor(timeAway / state.tickInterval);
          
          // Simulate up to 8 hours of offline progress
          const maxTicks = Math.min(ticksAway, 28800); // 8 hours worth of ticks
          
          for (let i = 0; i < maxTicks; i++) {
            get().tick();
          }
        }
      };
    },
    {
      name: 'scp-facility-game',
      version: 1
    }
  )
);