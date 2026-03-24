import React, { useState, useEffect } from 'react';
import { Board } from './components/Board';
import { Dashboard } from './components/Dashboard';
import { Gallery } from './components/Gallery';
import { useGame } from './useGame';
import { generateThemeSpaces, generateThemeImage, expandTheme } from './services/geminiService';
import { SPACES } from './constants';
import { Loader2, Star, LogIn, LogOut } from 'lucide-react';
import { auth, db } from './firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

type ViewState = 'home' | 'gallery' | 'game';

export default function App() {
  const { state, rollDice, buyProperty, upgradeProperty, endTurn, startGame } = useGame();
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [themeInput, setThemeInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const isAdmin = user?.email === 'uri@hastemedia.com';

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  useEffect(() => {
    if (!isGenerating) {
      setStatusMessage('');
      return;
    }

    const messages = [
      "Scouting prime real estate...",
      "Printing colorful money...",
      "Carving player tokens...",
      "Building houses and hotels...",
      "Writing Chance and Community Chest cards...",
      "Bribing the banker...",
      "Painting the board...",
      "Rolling the dice..."
    ];

    let currentIndex = 0;
    setStatusMessage(messages[0]);

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % messages.length;
      setStatusMessage(messages[currentIndex]);
    }, 2500);

    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleStartGame = async () => {
    setIsGenerating(true);
    setError('');
    setHasSaved(false);

    try {
      if (!themeInput.trim()) {
        const themeImage = await generateThemeImage('Nordic Countries');
        startGame('Nordic Countries', SPACES, undefined, undefined, themeImage);
        setCurrentView('game');
        return;
      }

      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 90000)
      );

      const generateAll = async () => {
        const expandedTheme = await expandTheme(themeInput);
        return Promise.all([
          generateThemeSpaces(themeInput, expandedTheme),
          generateThemeImage(themeInput)
        ]);
      };

      const [{ spaces: newSpaces, playerNames, playerIcons }, themeImage] = await Promise.race([
        generateAll(),
        timeoutPromise
      ]);

      startGame(themeInput, newSpaces, playerNames, playerIcons, themeImage);
      setCurrentView('game');
    } catch (err: any) {
      console.error(err);
      if (err.message === 'TIMEOUT') {
        setError(`Oops! The theme '${themeInput}' took too long. It might be too narrow to fill a whole board. Try expanding it - add a few more descriptive words.`);
      } else {
        setError('Failed to generate theme. Please try again or leave blank for default.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToFeatured = async () => {
    if (!isAdmin || !user || !state.theme) return;
    
    setIsSaving(true);
    try {
      const boardData = JSON.stringify({
        theme: state.theme,
        spaces: state.spaces,
        players: state.players
      });

      await addDoc(collection(db, 'featured_boards'), {
        theme: state.theme,
        imageUrl: state.themeImage || null,
        boardData,
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });
      
      setHasSaved(true);
    } catch (err) {
      console.error('Failed to save to featured:', err);
      alert('Failed to save board. Check console for details.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (currentView === 'gallery') {
    return (
      <Gallery 
        onBack={() => setCurrentView('home')} 
        onSelectBoard={(boardData) => {
          startGame(
            boardData.theme, 
            boardData.spaces, 
            boardData.players.map((p: any) => p.name), 
            boardData.players.map((p: any) => p.icon), 
            boardData.themeImage
          );
          setHasSaved(true); // Treat loaded boards as already saved
          setCurrentView('game');
        }} 
      />
    );
  }

  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-8 font-sans relative">
        <div className="absolute top-4 right-4 flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600 font-medium">
                {isAdmin ? '👑 Admin' : user.displayName}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Admin Login
            </button>
          )}
        </div>

        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200 text-center">
          <h1 className="text-4xl font-black text-slate-800 mb-2">Anyopoly</h1>
          <p className="text-slate-500 mb-8">Choose a theme for your Monopoly game!</p>
          
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="e.g. Pirates, Space, Medieval, Tech..."
              value={themeInput}
              onChange={(e) => setThemeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleStartGame();
                }
              }}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
              disabled={isGenerating}
            />
            
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            
            <div className="flex flex-col gap-2">
              <button
                onClick={handleStartGame}
                disabled={isGenerating}
                className="w-full py-4 rounded-xl font-bold text-lg transition-all active:scale-95 disabled:opacity-50 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm flex items-center justify-center gap-2 overflow-hidden"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin shrink-0" />
                    <span className="animate-pulse text-sm truncate">{statusMessage || 'Generating...'}</span>
                  </>
                ) : (
                  'Start Game'
                )}
              </button>
              {!themeInput.trim() && (
                <p className="text-sm text-slate-500">
                  (Default theme is "Nordic Countries" 🇩🇰 🇫🇮 🇮🇸 🇳🇴 🇸🇪)
                </p>
              )}
            </div>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-medium">OR</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button
              onClick={() => setCurrentView('gallery')}
              disabled={isGenerating}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all active:scale-95 disabled:opacity-50 bg-amber-500 text-white hover:bg-amber-600 shadow-sm flex items-center justify-center gap-2"
            >
              <Star className="w-6 h-6" />
              Featured Boards Gallery
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-8 font-sans relative">
      <button 
        onClick={() => setCurrentView('home')}
        className="absolute top-4 left-4 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-colors"
      >
        ← Back to Menu
      </button>

      <div className="max-w-7xl w-full flex flex-col lg:flex-row gap-8 items-start mt-12">
        <div className="flex-1 w-full flex justify-center">
          <Board gameState={state} />
        </div>
        <div className="w-full lg:w-96 shrink-0 flex flex-col gap-4">
          <div className="h-[800px]">
            <Dashboard 
              gameState={state} 
              onRoll={rollDice} 
              onBuy={buyProperty} 
              onUpgrade={upgradeProperty} 
              onEndTurn={endTurn} 
            />
          </div>
          
          {isAdmin && !hasSaved && (
            <button
              onClick={handleSaveToFeatured}
              disabled={isSaving}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all active:scale-95 disabled:opacity-50 bg-amber-500 text-white hover:bg-amber-600 shadow-sm flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Star className="w-6 h-6" />
                  Add to Featured Gallery
                </>
              )}
            </button>
          )}
          {isAdmin && hasSaved && (
            <div className="w-full py-4 rounded-xl font-bold text-lg bg-green-100 text-green-700 shadow-sm flex items-center justify-center gap-2 border border-green-200">
              <Star className="w-6 h-6 fill-green-700" />
              Saved to Featured!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
