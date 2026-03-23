export type SpaceType =
  | 'property'
  | 'go'
  | 'chance'
  | 'chest'
  | 'tax'
  | 'jail'
  | 'parking'
  | 'gotojail'
  | 'railroad'
  | 'utility';

export interface Space {
  id: number;
  name: string;
  type: SpaceType;
  color?: string;
  price?: number;
  rent?: number[]; // [base, 1 house, 2 houses, 3 houses, 4 houses, hotel]
  houseCost?: number;
}

export interface Player {
  id: number;
  name: string;
  color: string;
  balance: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  bankrupt: boolean;
}

export interface PropertyState {
  spaceId: number;
  ownerId: number | null;
  houses: number; // 0-5 (5 is hotel/IPO)
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  properties: Record<number, PropertyState>;
  dice: [number, number];
  doublesCount: number;
  turnPhase: 'roll' | 'action' | 'end';
  message: string;
  chanceCards: string[];
  chestCards: string[];
}
