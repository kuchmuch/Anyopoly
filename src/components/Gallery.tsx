import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, ArrowLeft } from 'lucide-react';

interface FeaturedBoard {
  id: string;
  theme: string;
  imageUrl?: string;
  boardData: string;
}

interface GalleryProps {
  onBack: () => void;
  onSelectBoard: (board: any) => void;
}

export function Gallery({ onBack, onSelectBoard }: GalleryProps) {
  const [boards, setBoards] = useState<FeaturedBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const q = query(collection(db, 'featured_boards'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const fetchedBoards = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FeaturedBoard[];
        setBoards(fetchedBoards);
      } catch (err) {
        console.error('Error fetching featured boards:', err);
        setError('Failed to load featured boards.');
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
          <h1 className="text-4xl font-black text-slate-800">Featured Boards</h1>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-8 bg-red-50 rounded-xl border border-red-200">
            {error}
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center text-slate-500 p-12 bg-white rounded-2xl shadow-sm border border-slate-200">
            <p className="text-xl">No featured boards yet.</p>
            <p className="mt-2">The admin hasn't added any boards to the gallery.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map(board => (
              <div 
                key={board.id} 
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => {
                  try {
                    const parsedData = JSON.parse(board.boardData);
                    if (!parsedData.themeImage && board.imageUrl) {
                      parsedData.themeImage = board.imageUrl;
                    }
                    onSelectBoard(parsedData);
                  } catch (e) {
                    console.error("Failed to parse board data", e);
                  }
                }}
              >
                <div className="h-48 bg-slate-200 relative overflow-hidden">
                  {board.imageUrl ? (
                    <img 
                      src={board.imageUrl} 
                      alt={board.theme} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-300">
                      <span className="text-4xl font-bold">?</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{board.theme}</h3>
                  <button className="w-full py-2 bg-slate-100 hover:bg-indigo-50 text-indigo-600 font-semibold rounded-lg transition-colors">
                    Play this Board
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
