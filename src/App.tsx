import React, { useState } from 'react';
import { JoinRoom } from './components/JoinRoom';
import { GameRoom } from './components/GameRoom';

function App() {
  const [isJoined, setIsJoined] = useState(false);

  return (
    <div className="min-h-screen">
      {!isJoined ? (
        <JoinRoom onJoin={() => setIsJoined(true)} />
      ) : (
        <GameRoom />
      )}
    </div>
  );
}

export default App;