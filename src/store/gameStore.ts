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
  maxLevel?: number;
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

export interface FacilityState {
  containmentPoints: number;
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
  gameStarted: boolean;
  tickInterval: number;
}

// Initial upgrades for SCP-087
const initialSCP087Upgrades: Record<string, Upgrade> = {
  flashlight: {
    id: 'flashlight',
    name: 'Better Flashlight',
    description: 'Increases Paranoia Energy per descent',
    cost: 10,
    owned: 0,
    effect: 1.5
  },
  training: {
    id: 'training',
    name: 'Psychological Training',
    description: 'Reduces encounter chance',
    cost: 25,
    owned: 0,
    effect: 0.9
  },
  rope: {
    id: 'rope',
    name: 'Safety Rope',
    description: 'Increases depth reached per descent',
    cost: 50,
    owned: 0,
    effect: 2
  },
  team: {
    id: 'team',
    name: 'Exploration Team',
    description: 'Automatically descends the stairwell',
    cost: 100,
    owned: 0,
    effect: 1
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
      rechargePerSec: 22,
      lowThreshold: 20,
    },
    personnel: [
      { 
        id: "p1", 
        name: "Operative Δ-7", 
        role: "Scout", 
        absoluteDepth: 0, 
        lane: "L",
        level: 1,
        experience: 0,
        speed: 1.2,
        survivalRate: 0.9,
        active: false,
        status: "active"
      },
      { 
        id: "p2", 
        name: "Tech A. Morse", 
        role: "Research", 
        absoluteDepth: 0, 
        lane: "R",
        level: 1,
        experience: 0,
        speed: 0.8,
        survivalRate: 0.7,
        active: false,
        status: "active"
      },
      { 
        id: "p3", 
        name: "Handler R-3", 
        role: "Handler", 
        absoluteDepth: 0, 
        lane: "L",
        level: 1,
        experience: 0,
        speed: 1.0,
        survivalRate: 0.95,
        active: false,
        status: "active"
      },
    ],
    teamActive: false,
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
    containmentPoints: 0,
    foundationKnowledge: 0,
    globalUpgrades: {},
    lastSaveTime: Date.now(),
    totalPlayTime: 0
  },
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
  movePersonnel: (dt: number) => void;
  spawnEncounterAtDepth: (absoluteDepth: number, kind: EncounterKind) => void;
  resolveEncounter: (id: string) => void;
  cullExpiredEncounters: () => void;
  
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
    (set, get) => ({
      ...defaultState,

      // SCP-087 Actions - Personnel Management
      toggleTeamExploration: () => {
        set((state) => {
          const newTeamActive = !state.scp087.teamActive;
          return {
            ...state,
            scp087: {
              ...state.scp087,
              teamActive: newTeamActive,
              personnel: state.scp087.personnel.map(p => ({
                ...p,
                active: newTeamActive
              }))
            }
          };
        });
      },

      upgradePersonnel: (personnelId: string, upgradeType: string) => {
        const state = get();
        const personnel = state.scp087.personnel.find(p => p.id === personnelId);
        if (!personnel) return;

        const costs = {
          level: 50 + (personnel.level * 25),
          speed: 30 + (personnel.speed * 20),
          survival: 40 + (personnel.survivalRate * 50)
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
                case 'speed':
                  return { ...p, speed: p.speed + 0.1 };
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
        
        set((state) => {
          const newState = {
            ...state,
            scp087: {
              ...state.scp087,
              paranoiaEnergy: state.scp087.paranoiaEnergy - upgrade.cost,
              upgrades: {
                ...state.scp087.upgrades,
                [upgradeId]: {
                  ...upgrade,
                  owned: upgrade.owned + 1,
                  cost: Math.floor(upgrade.cost * 1.15) // 15% cost increase
                }
              },
              autoDescend: upgradeId === 'team' ? true : state.scp087.autoDescend
            }
          };
          
          // Apply flashlight upgrade effects
          if (upgradeId === 'flashlight') {
            newState.scp087.flashlight = {
              ...newState.scp087.flashlight,
              capacity: newState.scp087.flashlight.capacity + 20,
              drainPerSec: Math.max(2.5, newState.scp087.flashlight.drainPerSec - 0.35)
            };
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
        set((state) => ({
          scp087: {
            ...state.scp087,
            flashlight: {
              ...state.scp087.flashlight,
              on: !state.scp087.flashlight.on
            }
          }
        }));
      },

      drainFlashlight: (dt: number) => {
        set((state) => {
          const f = state.scp087.flashlight;
          if (!f.on) return state;
          
          const newCharge = Math.max(0, f.charge - f.drainPerSec * dt);
          return {
            ...state,
            scp087: {
              ...state.scp087,
              flashlight: {
                ...f,
                charge: newCharge,
                on: newCharge > 0 ? f.on : false
              },
              flashlightBattery: newCharge // sync legacy field
            }
          };
        });
      },

      rechargeFlashlightV2: (dt: number) => {
        set((state) => {
          const f = state.scp087.flashlight;
          const newCharge = Math.min(f.capacity, f.charge + f.rechargePerSec * dt);
          return {
            ...state,
            scp087: {
              ...state.scp087,
              flashlight: {
                ...f,
                charge: newCharge,
                on: newCharge > 0 && !f.on ? true : f.on
              },
              flashlightBattery: newCharge // sync legacy field
            }
          };
        });
      },

      movePersonnel: (dt: number) => {
        set((state) => {
          if (!state.scp087.teamActive) return state;
          
          const baseSpeed = 18 * (state.scp087.flashlight.on ? 1 : 0.6);
          const newPersonnel = state.scp087.personnel.map(p => {
            if (!p.active) return p;
            
            const personnelSpeed = baseSpeed * p.speed;
            return {
              ...p,
              absoluteDepth: p.absoluteDepth + personnelSpeed * dt,
              experience: p.experience + (personnelSpeed * dt * 0.1)
            };
          });
          
          // Update player depth to follow furthest personnel
          const maxDepth = Math.max(...newPersonnel.map(p => p.absoluteDepth));
          
          return {
            ...state,
            scp087: {
              ...state.scp087,
              personnel: newPersonnel,
              currentDepth: maxDepth,
              depth: maxDepth
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
                rewardPE: kind === "087-1" ? 150 : 40,
                expiresAt: Date.now() + (kind === "087-1" ? 9000 : 6000),
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
          const newEncounters = [...state.scp087.activeEncounters];
          newEncounters.splice(encounterIndex, 1);
          
          return {
            ...state,
            scp087: {
              ...state.scp087,
              paranoiaEnergy: state.scp087.paranoiaEnergy + encounter.rewardPE,
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
          const validEncounters = state.scp087.activeEncounters.filter(e => e.expiresAt > now);
          
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

      // Game tick system
      tick: () => {
        const state = get();
        
        set((prevState) => {
          const newState = { ...prevState };
          
          // SCP-087 auto descend
          if (newState.scp087.autoDescend && newState.scp087.upgrades.team.owned > 0) {
            const autoEnergyGain = Math.floor(newState.scp087.currentDepth * 0.1 * newState.scp087.upgrades.team.owned);
            newState.scp087.paranoiaEnergy += autoEnergyGain;
            newState.scp087.currentDepth += newState.scp087.upgrades.team.owned;
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
      },

      resetFacility: () => {
        const state = get();
        const knowledgeGain = Math.floor(state.facility.containmentPoints / 1000);
        
        set({
          ...defaultState,
          facility: {
            ...defaultState.facility,
            foundationKnowledge: state.facility.foundationKnowledge + knowledgeGain
          },
          gameStarted: true
        });
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
    }),
    {
      name: 'scp-facility-game',
      version: 1
    }
  )
);