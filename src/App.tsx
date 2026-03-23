import React from 'react';
import { Board } from './components/Board';
import { Dashboard } from './components/Dashboard';
import { useGame } from './useGame';

export default function App() {
  const { state, rollDice, buyProperty, upgradeProperty, endTurn } = useGame();

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-8 font-sans">
      <div className="max-w-7xl w-full flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 w-full flex justify-center">
          <Board gameState={state} />
        </div>
        <div className="w-full lg:w-96 shrink-0 h-[800px]">
          <Dashboard 
            gameState={state} 
            onRoll={rollDice} 
            onBuy={buyProperty} 
            onUpgrade={upgradeProperty} 
            onEndTurn={endTurn} 
          />
        </div>
      </div>
    </div>
  );
}
