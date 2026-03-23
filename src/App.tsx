import React, { useState } from 'react';
import { Board } from './components/Board';
import { Dashboard } from './components/Dashboard';
import { useGame } from './useGame';
import { generateThemeSpaces, generateThemeImage } from './services/geminiService';
import { SPACES } from './constants';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { state, rollDice, buyProperty, upgradeProperty, endTurn, startGame } = useGame();
  const [isSetup, setIsSetup] = useState(true);
  const [themeInput, setThemeInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleStartGame = async () => {
    setIsGenerating(true);
    setError('');

    try {
      if (!themeInput.trim()) {
        // Start with default theme, but generate a picture for it
        const themeImage = await generateThemeImage('Nordic Countries');
        startGame('Nordic Countries', SPACES, undefined, undefined, themeImage);
        setIsSetup(false);
        return;
      }

      const [{ spaces: newSpaces, playerNames, playerIcons }, themeImage] = await Promise.all([
        generateThemeSpaces(themeInput),
        generateThemeImage(themeInput)
      ]);
      startGame(themeInput, newSpaces, playerNames, playerIcons, themeImage);
      setIsSetup(false);
    } catch (err) {
      console.error(err);
      setError('Failed to generate theme. Please try again or leave blank for default.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isSetup) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-8 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200 text-center">
          <h1 className="text-4xl font-black text-slate-800 mb-2">Anyopoly</h1>
          <p className="text-slate-500 mb-8">Choose a theme for your game!</p>
          
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="e.g. Pirates, Space, Medieval, Tech..."
              value={themeInput}
              onChange={(e) => setThemeInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
              disabled={isGenerating}
            />
            
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            
            <button
              onClick={handleStartGame}
              disabled={isGenerating}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all active:scale-95 disabled:opacity-50 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Generating Board...
                </>
              ) : themeInput.trim() ? (
                'Generate Theme & Start'
              ) : (
                <div className="flex flex-col items-center leading-tight">
                  <span>Start Default Game</span>
                  <span className="text-sm font-medium opacity-90 mt-1">(Nordic Countries 🇩🇰 🇫🇮 🇮🇸 🇳🇴 🇸🇪)</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
