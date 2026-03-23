import React from 'react';
import { GameState } from '../types';
import { motion } from 'motion/react';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Building, DollarSign, User } from 'lucide-react';

interface DashboardProps {
  gameState: GameState;
  onRoll: () => void;
  onBuy: () => void;
  onUpgrade: () => void;
  onEndTurn: () => void;
}

const DiceIcon = ({ value, className }: { value: number, className?: string }) => {
  switch (value) {
    case 1: return <Dice1 className={className} />;
    case 2: return <Dice2 className={className} />;
    case 3: return <Dice3 className={className} />;
    case 4: return <Dice4 className={className} />;
    case 5: return <Dice5 className={className} />;
    case 6: return <Dice6 className={className} />;
    default: return <Dice1 className={className} />;
  }
};

export function Dashboard({ gameState, onRoll, onBuy, onUpgrade, onEndTurn }: DashboardProps) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const currentSpace = gameState.spaces[currentPlayer.position];
  const propState = gameState.properties[currentSpace.id];

  const canBuy = gameState.turnPhase === 'action' && 
                 (currentSpace.type === 'property' || currentSpace.type === 'railroad' || currentSpace.type === 'utility') && 
                 !propState && 
                 currentPlayer.balance >= (currentSpace.price || Infinity);

  const canUpgrade = gameState.turnPhase === 'action' && 
                     currentSpace.type === 'property' && 
                     propState?.ownerId === currentPlayer.id && 
                     propState.houses < 5 && 
                     currentPlayer.balance >= (currentSpace.houseCost || Infinity);

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-full border border-slate-200">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">{gameState.theme} Dashboard</h2>
          <div className="flex gap-2">
            <DiceIcon value={gameState.dice[0]} className="w-8 h-8 text-white" />
            <DiceIcon value={gameState.dice[1]} className="w-8 h-8 text-white" />
          </div>
        </div>
        
        {/* Message Log */}
        <div className="bg-slate-800 p-4 rounded-xl text-sm text-slate-300 min-h-[80px] flex items-center">
          <motion.p
            key={gameState.message}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="leading-relaxed"
          >
            {gameState.message}
          </motion.p>
        </div>
      </div>

      {/* Action Area */}
      <div className="p-6 flex-1 flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md"
            style={{ backgroundColor: currentPlayer.color }}
          >
            {currentPlayer.icon || currentPlayer.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">{currentPlayer.name}'s Turn</h3>
            <p className="text-slate-500 font-medium">${currentPlayer.balance}M</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-auto">
          <button
            onClick={onRoll}
            disabled={gameState.turnPhase !== 'roll'}
            className="col-span-2 py-4 rounded-xl font-bold text-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
          >
            Roll Dice
          </button>
          
          <button
            onClick={onBuy}
            disabled={!canBuy}
            className="py-3 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200"
          >
            Buy Property
          </button>
          
          <button
            onClick={onUpgrade}
            disabled={!canUpgrade}
            className="py-3 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200"
          >
            Upgrade / Build
          </button>

          <button
            onClick={onEndTurn}
            disabled={gameState.turnPhase === 'roll'}
            className="col-span-2 py-4 rounded-xl font-bold text-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300"
          >
            End Turn / Skip Action
          </button>
        </div>
      </div>

      {/* Players List */}
      <div className="bg-slate-50 p-6 border-t border-slate-200">
        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Players</h4>
        <div className="flex flex-col gap-3">
          {gameState.players.map(p => (
            <div key={p.id} className={`flex items-center justify-between p-3 rounded-lg border ${p.id === currentPlayer.id ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white'} ${p.bankrupt ? 'opacity-50 grayscale' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm border border-white" style={{ backgroundColor: p.color }}>
                  {p.icon || ''}
                </div>
                <span className="font-semibold text-slate-700">{p.name}</span>
                {p.bankrupt && <span className="text-xs text-red-500 font-bold uppercase">Bankrupt</span>}
                {p.inJail && <span className="text-xs text-orange-500 font-bold uppercase">In Jail</span>}
                {p.getOutOfJailFreeCards ? <span className="text-xs text-emerald-600 font-bold bg-emerald-100 px-2 py-0.5 rounded-full" title="Get Out of Jail Free Cards">{p.getOutOfJailFreeCards} 🎟️</span> : null}
              </div>
              <span className="font-mono font-bold text-slate-900">${p.balance}M</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
