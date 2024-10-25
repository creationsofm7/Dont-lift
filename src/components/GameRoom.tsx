import React, { useEffect, useState } from 'react';
import { socket } from '../socket';
import { useGameStore } from '../store';
import { Timer, Crown } from 'lucide-react';

interface Player {
  id: string;
  username: string;
  score: number;
  isHolding: boolean;
}

export const GameRoom: React.FC = () => {
  const { username, roomId } = useGameStore();
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHolding, setIsHolding] = useState(false);
  const [currentHolder, setCurrentHolder] = useState<string | null>(null);
  const [holdTime, setHoldTime] = useState(0);

  useEffect(() => {
    socket.emit('joinRoom', { roomId, username });

    socket.on('playerList', ({ players }) => {
      setPlayers(players);
    });

    socket.on('buttonStateChanged', ({ holderId, isHeld }) => {
      setCurrentHolder(holderId);
    });

    socket.on('scoreUpdated', ({ playerId, score }) => {
      setPlayers(prev =>
        prev.map(player =>
          player.id === playerId ? { ...player, score } : player
        )
      );
    });

    socket.on('playerLeft', ({ playerId }) => {
      setPlayers(prev => prev.filter(player => player.id !== playerId));
    });

    return () => {
      socket.off('playerList');
      socket.off('buttonStateChanged');
      socket.off('scoreUpdated');
      socket.off('playerLeft');
    };
  }, [roomId, username]);

  useEffect(() => {
    let interval: number;
    if (isHolding) {
      interval = setInterval(() => {
        setHoldTime(prev => prev + 0.1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isHolding]);

  const handleMouseDown = () => {
    if (!currentHolder) {
      setIsHolding(true);
      setHoldTime(0);
      socket.emit('startHolding', { roomId });
    }
  };

  const handleMouseUp = () => {
    if (isHolding) {
      setIsHolding(false);
      socket.emit('stopHolding', { roomId });
    }
  };

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">
            Room: {roomId}
          </h2>
          <div className="flex justify-center mb-8">
            <button
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              disabled={currentHolder && currentHolder !== socket.id}
              className={`
                w-48 h-48 rounded-full shadow-lg transition-all duration-200
                ${isHolding 
                  ? 'bg-purple-600 scale-95' 
                  : 'bg-purple-500 hover:bg-purple-600'
                }
                ${currentHolder && currentHolder !== socket.id 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer'
                }
              `}
            >
              <div className="h-full flex flex-col items-center justify-center text-white">
                <Timer className="w-12 h-12 mb-2" />
                <span className="text-2xl font-bold">
                  {holdTime.toFixed(1)}s
                </span>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Crown className="w-6 h-6 text-yellow-500 mr-2" />
            Leaderboard
          </h3>
          <div className="space-y-4">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`
                  flex items-center justify-between p-4 rounded-lg
                  ${index === 0 ? 'bg-yellow-50' : 'bg-gray-50'}
                  ${player.id === socket.id ? 'border-2 border-purple-500' : ''}
                `}
              >
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-gray-500 mr-4">
                    #{index + 1}
                  </span>
                  <span className="font-medium text-gray-800">
                    {player.username}
                    {player.id === socket.id && ' (You)'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-bold text-purple-600">
                    {player.score.toFixed(1)}s
                  </span>
                  {player.isHolding && (
                    <div className="ml-3 px-2 py-1 bg-purple-100 text-purple-600 rounded-full text-sm">
                      Holding
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};