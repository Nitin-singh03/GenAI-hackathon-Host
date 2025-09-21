import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

function ReadAloudButton({ text }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleReadAloud = () => {
    if (isPlaying) {
      // Stop current speech
      speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      // Start reading
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <button
      onClick={handleReadAloud}
      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors duration-200 ${
        isPlaying
          ? 'bg-red-100 text-red-700 hover:bg-red-200'
          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
      }`}
      title={isPlaying ? 'Stop reading' : 'Read aloud'}
    >
      {isPlaying ? (
        <>
          <VolumeX className="w-3 h-3" />
          Stop
        </>
      ) : (
        <>
          <Volume2 className="w-3 h-3" />
          Read
        </>
      )}
    </button>
  );
}

export default ReadAloudButton;