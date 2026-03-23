import React from 'react';
import { GameState } from '../types';
import { motion } from 'motion/react';
import { ArrowRight, Lock, Coffee, Siren, HelpCircle, Archive, Train, Zap, Landmark } from 'lucide-react';

interface BoardProps {
  gameState: GameState;
}

export function Board({ gameState }: BoardProps) {
  const getGridPosition = (id: number) => {
    if (id >= 0 && id <= 10) return { row: 11, col: 11 - id };
    if (id >= 11 && id <= 20) return { col: 1, row: 21 - id };
    if (id >= 21 && id <= 30) return { row: 1, col: id - 19 };
    if (id >= 31 && id <= 39) return { col: 11, row: id - 29 };
    return { row: 1, col: 1 };
  };

  const getSpaceIcon = (type: string) => {
    switch (type) {
      case 'go': return <ArrowRight className="w-5 h-5 text-red-500 mb-1" />;
      case 'jail': return <Lock className="w-5 h-5 text-orange-500 mb-1" />;
      case 'parking': return <Coffee className="w-5 h-5 text-blue-500 mb-1" />;
      case 'gotojail': return <Siren className="w-5 h-5 text-red-600 mb-1" />;
      case 'chance': return <HelpCircle className="w-5 h-5 text-purple-500 mb-1" />;
      case 'chest': return <Archive className="w-5 h-5 text-amber-600 mb-1" />;
      case 'railroad': return <Train className="w-5 h-5 text-slate-700 mb-1" />;
      case 'utility': return <Zap className="w-5 h-5 text-amber-500 mb-1" />;
      case 'tax': return <Landmark className="w-5 h-5 text-slate-600 mb-1" />;
      default: return null;
    }
  };

  return (
    <div 
      className="relative w-full max-w-4xl aspect-square bg-green-50 border-4 border-slate-800 p-2 grid gap-1"
      style={{ gridTemplateColumns: 'repeat(11, minmax(0, 1fr))', gridTemplateRows: 'repeat(11, minmax(0, 1fr))' }}
    >
      {/* Center Logo */}
      <div className="col-start-2 col-end-11 row-start-2 row-end-11 bg-green-100 flex items-center justify-center rounded-xl shadow-inner border-2 border-green-200">
        <div className="text-center transform -rotate-45">
          <h1 className="text-5xl font-black text-red-600 tracking-tighter drop-shadow-md uppercase">{gameState.theme}</h1>
          <p className="text-xl font-bold text-slate-700 mt-2">Monopoly Edition</p>
        </div>
      </div>

      {/* Spaces */}
      {gameState.spaces.map((space) => {
        const pos = getGridPosition(space.id);
        const propState = gameState.properties[space.id];
        const owner = propState?.ownerId !== undefined && propState.ownerId !== null ? gameState.players[propState.ownerId] : null;
        
        const playersOnSpace = gameState.players.filter(p => p.position === space.id && !p.bankrupt);

        return (
          <div
            key={space.id}
            className="relative border border-slate-400 bg-white flex flex-col text-[10px] leading-tight overflow-hidden"
            style={{
              gridColumn: pos.col,
              gridRow: pos.row,
            }}
          >
            {/* Color Bar */}
            {space.color && (
              <div
                className="h-4 w-full border-b border-slate-400 shrink-0"
                style={{ backgroundColor: space.color }}
              />
            )}
            
            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-1 text-center font-semibold text-slate-800 relative z-0">
              {getSpaceIcon(space.type)}
              <span className="line-clamp-2" title={space.name}>{space.name}</span>
              {space.price && <span className="mt-1 text-slate-600">${space.price}M</span>}
            </div>

            {/* Ownership Indicator */}
            {owner && (
              <div
                className="absolute bottom-0 left-0 right-0 h-1.5 z-0"
                style={{ backgroundColor: owner.color }}
              />
            )}

            {/* Houses/Upgrades */}
            {propState && propState.houses > 0 && (
              <div className="absolute top-0 left-0 right-0 flex justify-center gap-0.5 pt-0.5 z-0">
                {Array.from({ length: propState.houses }).map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${propState.houses === 5 ? 'bg-red-500' : 'bg-green-500'}`} />
                ))}
              </div>
            )}

            {/* Player Tokens */}
            {playersOnSpace.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center gap-1 flex-wrap p-1 z-10 pointer-events-none">
                {playersOnSpace.map((player) => (
                  <motion.div
                    key={player.id}
                    layoutId={`player-${player.id}`}
                    className="w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center text-xs shrink-0"
                    style={{ backgroundColor: player.color }}
                    transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                    title={player.name}
                  >
                    {player.icon || player.name.charAt(0)}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
