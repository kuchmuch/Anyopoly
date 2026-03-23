import { useState, useCallback } from 'react';
import { GameState, Player, PropertyState } from './types';
import { SPACES, CHANCE_CARDS, CHEST_CARDS } from './constants';

const INITIAL_PLAYERS: Player[] = [
  { id: 0, name: 'Viking', color: '#ef4444', balance: 1500, position: 0, inJail: false, jailTurns: 0, bankrupt: false },
  { id: 1, name: 'Explorer', color: '#3b82f6', balance: 1500, position: 0, inJail: false, jailTurns: 0, bankrupt: false },
];

const INITIAL_STATE: GameState = {
  theme: 'Nordic Countries',
  spaces: SPACES,
  players: INITIAL_PLAYERS,
  currentPlayerIndex: 0,
  properties: {},
  dice: [1, 1],
  doublesCount: 0,
  turnPhase: 'roll',
  message: 'Welcome to Nordic Countries Monopoly! Viking, roll the dice.',
  chanceCards: [...CHANCE_CARDS].sort(() => Math.random() - 0.5),
  chestCards: [...CHEST_CARDS].sort(() => Math.random() - 0.5),
};

export function useGame() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);

  const rollDice = useCallback(() => {
    if (state.turnPhase !== 'roll') return;

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const isDouble = d1 === d2;
    const total = d1 + d2;

    setState((prev) => {
      const currentPlayer = prev.players[prev.currentPlayerIndex];
      if (currentPlayer.bankrupt) {
        return { ...prev, turnPhase: 'end', message: `${currentPlayer.name} is bankrupt.` };
      }

      let newPosition = currentPlayer.position;
      let newBalance = currentPlayer.balance;
      const wasInJail = currentPlayer.inJail;
      let inJail = currentPlayer.inJail;
      let jailTurns = currentPlayer.jailTurns;
      let doublesCount = prev.doublesCount;
      let message = `${currentPlayer.name} rolled ${d1} and ${d2}. `;

      if (inJail) {
        if (isDouble) {
          message += `Rolled doubles! Escaped ${prev.spaces[10].name}. `;
          inJail = false;
          jailTurns = 0;
          newPosition = (newPosition + total) % 40;
        } else {
          jailTurns++;
          if (jailTurns >= 3) {
            message += `Paid $50M fine to escape ${prev.spaces[10].name}. `;
            newBalance -= 50;
            inJail = false;
            jailTurns = 0;
            newPosition = (newPosition + total) % 40;
          } else {
            message += `Still in ${prev.spaces[10].name}. `;
            return {
              ...prev,
              dice: [d1, d2],
              players: prev.players.map((p, i) => i === prev.currentPlayerIndex ? { ...p, jailTurns } : p),
              turnPhase: 'end',
              message
            };
          }
        }
      } else {
        if (isDouble) {
          doublesCount++;
          if (doublesCount === 3) {
            message += `Three doubles! Go to ${prev.spaces[10].name}. `;
            return {
              ...prev,
              dice: [d1, d2],
              doublesCount: 0,
              players: prev.players.map((p, i) => i === prev.currentPlayerIndex ? { ...p, position: 10, inJail: true, jailTurns: 0 } : p),
              turnPhase: 'end',
              message
            };
          }
        } else {
          doublesCount = 0;
        }
        
        newPosition = (newPosition + total) % 40;
        if (newPosition < currentPlayer.position) {
          message += `Passed ${prev.spaces[0].name}! Collect $200M. `;
          newBalance += 200;
        }
      }

      const space = prev.spaces[newPosition];
      message += `Landed on ${space.name}. `;

      let nextPhase: 'roll' | 'action' | 'end' = (isDouble && !wasInJail) ? 'roll' : 'end';
      let updatedProperties = { ...prev.properties };

      if (space.type === 'property' || space.type === 'railroad' || space.type === 'utility') {
        const propState = updatedProperties[newPosition];
        if (!propState) {
          nextPhase = 'action'; // Can buy
        } else if (propState.ownerId !== null && propState.ownerId !== currentPlayer.id) {
          // Pay rent
          let rent = 0;
          if (space.type === 'property') {
            rent = space.rent![propState.houses];
            // Check monopoly for double base rent if 0 houses (simplified: just use base rent for now)
          } else if (space.type === 'railroad') {
            const rrCount = Object.values(updatedProperties).filter((p: any) => p.ownerId === propState.ownerId && prev.spaces[p.spaceId].type === 'railroad').length;
            rent = space.rent![rrCount - 1];
          } else if (space.type === 'utility') {
            const utilCount = Object.values(updatedProperties).filter((p: any) => p.ownerId === propState.ownerId && prev.spaces[p.spaceId].type === 'utility').length;
            rent = utilCount === 2 ? total * 10 : total * 4;
          }
          
          message += `Paid $${rent}M rent to ${prev.players[propState.ownerId].name}. `;
          newBalance -= rent;
          
          // Give rent to owner
          prev.players[propState.ownerId].balance += rent;
        } else if (propState.ownerId === currentPlayer.id && space.type === 'property' && propState.houses < 5) {
           nextPhase = 'action'; // Can upgrade
        }
      } else if (space.type === 'tax') {
        message += `Paid $${space.price}M tax. `;
        newBalance -= space.price!;
      } else if (space.type === 'gotojail') {
        message += `Go directly to ${prev.spaces[10].name}! `;
        newPosition = 10;
        inJail = true;
        nextPhase = 'end';
      } else if (space.type === 'chance' || space.type === 'chest') {
        message += `Drew a card (simplified: no effect for now). `;
        // Implementing full cards is complex, let's just do a simple random money effect for now
        const amount = Math.floor(Math.random() * 100) - 50;
        if (amount > 0) {
           message += `Good fortune! Gained $${amount}M. `;
           newBalance += amount;
        } else {
           message += `Bad luck! Lost $${Math.abs(amount)}M. `;
           newBalance += amount;
        }
      }

      if (newBalance < 0) {
         message += `You are bankrupt! `;
         // Release properties
         Object.keys(updatedProperties).forEach(key => {
            if (updatedProperties[Number(key)].ownerId === currentPlayer.id) {
               delete updatedProperties[Number(key)];
            }
         });
         nextPhase = 'end';
      }

      const updatedPlayers = prev.players.map((p, i) => {
        if (i === prev.currentPlayerIndex) {
          return { ...p, position: newPosition, balance: newBalance, inJail, jailTurns, bankrupt: newBalance < 0 };
        }
        return p;
      });

      return {
        ...prev,
        dice: [d1, d2],
        doublesCount,
        players: updatedPlayers,
        properties: updatedProperties,
        turnPhase: nextPhase,
        message
      };
    });
  }, [state.turnPhase]);

  const buyProperty = useCallback(() => {
    setState((prev) => {
      const currentPlayer = prev.players[prev.currentPlayerIndex];
      const space = prev.spaces[currentPlayer.position];
      
      if (currentPlayer.balance >= space.price!) {
        return {
          ...prev,
          players: prev.players.map((p, i) => i === prev.currentPlayerIndex ? { ...p, balance: p.balance - space.price! } : p),
          properties: {
            ...prev.properties,
            [currentPlayer.position]: { spaceId: currentPlayer.position, ownerId: currentPlayer.id, houses: 0 }
          },
          turnPhase: prev.doublesCount > 0 ? 'roll' : 'end',
          message: `${currentPlayer.name} bought ${space.name} for $${space.price}M.`
        };
      }
      return prev;
    });
  }, []);

  const upgradeProperty = useCallback(() => {
    setState((prev) => {
      const currentPlayer = prev.players[prev.currentPlayerIndex];
      const space = prev.spaces[currentPlayer.position];
      const propState = prev.properties[currentPlayer.position];
      
      if (propState && propState.ownerId === currentPlayer.id && propState.houses < 5 && currentPlayer.balance >= space.houseCost!) {
        return {
          ...prev,
          players: prev.players.map((p, i) => i === prev.currentPlayerIndex ? { ...p, balance: p.balance - space.houseCost! } : p),
          properties: {
            ...prev.properties,
            [currentPlayer.position]: { ...propState, houses: propState.houses + 1 }
          },
          turnPhase: prev.doublesCount > 0 ? 'roll' : 'end',
          message: `${currentPlayer.name} upgraded ${space.name} for $${space.houseCost}M.`
        };
      }
      return prev;
    });
  }, []);

  const endTurn = useCallback(() => {
    setState((prev) => {
      if (prev.doublesCount > 0 && prev.turnPhase === 'action') {
        return {
          ...prev,
          turnPhase: 'roll',
          message: `${prev.players[prev.currentPlayerIndex].name} skipped action. Roll again!`
        };
      }

      let nextPlayerIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
      while (prev.players[nextPlayerIndex].bankrupt) {
         nextPlayerIndex = (nextPlayerIndex + 1) % prev.players.length;
         if (nextPlayerIndex === prev.currentPlayerIndex) {
            // Game over
            return { ...prev, message: 'Game Over!' };
         }
      }
      return {
        ...prev,
        currentPlayerIndex: nextPlayerIndex,
        turnPhase: 'roll',
        doublesCount: 0,
        message: `${prev.players[nextPlayerIndex].name}'s turn. Roll the dice.`
      };
    });
  }, []);

  const startGame = useCallback((theme: string, spaces: typeof SPACES, playerNames?: string[]) => {
    const newPlayers = [...INITIAL_PLAYERS];
    if (playerNames && playerNames.length >= 2) {
      newPlayers[0] = { ...newPlayers[0], name: playerNames[0] };
      newPlayers[1] = { ...newPlayers[1], name: playerNames[1] };
    }

    setState({
      ...INITIAL_STATE,
      theme,
      spaces,
      players: newPlayers,
      message: `Welcome to ${theme} Monopoly! ${newPlayers[0].name}, roll the dice.`,
    });
  }, []);

  return { state, rollDice, buyProperty, upgradeProperty, endTurn, startGame };
}
