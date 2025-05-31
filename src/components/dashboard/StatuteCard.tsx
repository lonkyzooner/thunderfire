import React, { useState, useRef } from 'react';
import { handleStatuteLookup } from '../RSCodes';
import { liveKitVoiceService } from '../../services/livekit/LiveKitVoiceService';

const StatuteCard: React.FC = () => {
  const [statute, setStatute] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [statuteUrl, setStatuteUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);

  const speak = (text: string) => {
    liveKitVoiceService.speak(text, 'ash');
  };

  const handleLookup = async () => {
    setError('');
    if (!statute.trim()) {
      setError('Please enter a statute or keyword.');
      return;
    }
    await handleStatuteLookup(
      statute,
      setIsLoading,
      setResult,
      () => {}, // setSuggestedCharges (not used)
      speak,
      resultRef,
      setStatuteUrl
    );
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-lg shadow-lg p-4">
      <h2 className="text-lg font-semibold mb-2">Statute Lookup</h2>
      <div className="flex flex-col gap-2 mb-2">
        <input
          type="text"
          value={statute}
          onChange={e => setStatute(e.target.value)}
          placeholder="Enter RS code or keyword (e.g. La. R.S. 14:67, theft)"
          className="px-3 py-2 rounded border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={handleLookup}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Looking up...' : 'Lookup Statute'}
        </button>
      </div>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      <div ref={resultRef} />
      {result && (
        <div className="mt-3 p-3 bg-muted rounded text-sm text-muted-foreground border border-border">
          <div>{result}</div>
          {statuteUrl && (
            <a href={statuteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 mt-2">
              <small>View Statute</small>
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default StatuteCard;

