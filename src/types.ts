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
  description?: string;
}

export type CardAction = 
  | { type: 'advance', to: number | 'nearest_railroad' | 'nearest_utility', rentMultiplier?: number }
  | { type: 'collect', amount: number }
  | { type: 'pay', amount: number }
  | { type: 'collect_players', amount: number }
  | { type: 'pay_players', amount: number }
  | { type: 'get_out_of_jail' }
  | { type: 'move_back', spaces: number }
  | { type: 'gotojail' }
  | { type: 'repairs', house: number, hotel: number };

export interface Card {
  text: string;
  action: CardAction;
}

export interface Player {
  id: number;
  name: string;
  color: string;
  icon: string;
  balance: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  bankrupt: boolean;
  getOutOfJailFreeCards: number;
}

export interface PropertyState {
  spaceId: number;
  ownerId: number | null;
  houses: number; // 0-5 (5 is hotel/IPO)
}

export interface GameState {
  theme: string;
  themeImage?: string;
  spaces: Space[];
  players: Player[];
  currentPlayerIndex: number;
  properties: Record<number, PropertyState>;
  dice: [number, number];
  doublesCount: number;
  turnPhase: 'roll' | 'action' | 'end';
  message: string;
  chanceCards: Card[];
  chestCards: Card[];
}
