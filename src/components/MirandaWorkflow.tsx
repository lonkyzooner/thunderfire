import React, { useState } from 'react';

interface MirandaLog {
  id: string;
  suspectName: string;
  dob: string;
  caseNumber: string;
  timestamp: number;
  officer: string;
  language: string;
}

const MirandaWorkflow: React.FC = () => {
  const [step, setStep] = useState(1);
  const [suspectName, setSuspectName] = useState('');
  const [dob, setDob] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [logs, setLogs] = useState<MirandaLog[]>([]);
  const [language, setLanguage] = useState('english');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleStart = () => setStep(2);

  const handleComplete = async () => {
    const log: MirandaLog = {
      id: `${Date.now()}`,
      suspectName,
      dob,
      caseNumber,
      timestamp: Date.now(),
      officer: 'Officer Name', // TODO: Replace with actual officer info
      language,
    };
    setLogs(prev => [...prev, log]);
    // TODO: Save log to backend or IndexedDB
    try {
      const response = await fetch('/api/miranda-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
      if (!response.ok) {
        console.warn('Failed to save Miranda log to backend');
      }
    } catch (err) {
      console.error('Error saving Miranda log:', err);
    }
    setStep(3);
  };

  return (
    <div className="p-4 space-y-4">
      {step === 1 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Enter Suspect Details</h2>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full border p-2 rounded text-black"
          >
            <option value="english">English</option>
            <option value="spanish">Spanish</option>
            <option value="french">French</option>
            <option value="vietnamese">Vietnamese</option>
            <option value="mandarin">Mandarin</option>
            <option value="arabic">Arabic</option>
          </select>
          <input
            value={suspectName}
            onChange={(e) => setSuspectName(e.target.value)}
            placeholder="Suspect Name"
            className="w-full border p-2 rounded text-black"
          />
          <input
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            placeholder="Date of Birth"
            className="w-full border p-2 rounded text-black"
          />
          <input
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
            placeholder="Case Number"
            className="w-full border p-2 rounded text-black"
          />
          <button
            onClick={async () => {
              setIsSpeaking(true);
              try {
                const translatedText = await translateMiranda(language);
                await speakMiranda(translatedText);
              } catch (err) {
                console.error('Error during Miranda translation/speech:', err);
              }
              setIsSpeaking(false);
              handleStart();
            }}
            className="px-4 py-2 bg-primary text-white rounded"
            disabled={isSpeaking}
          >
            {isSpeaking ? 'Speaking...' : 'Start Miranda Rights'}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Reading Miranda Rights</h2>
          <p>You have the right to remain silent...</p>
          <p>Anything you say can and will be used against you in a court of law...</p>
          <p>You have the right to an attorney...</p>
          <p>If you cannot afford an attorney, one will be provided for you...</p>
          <button
            onClick={handleComplete}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Complete and Log
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Miranda Rights Logged</h2>
          <p>Suspect: {suspectName}</p>
          <p>DOB: {dob}</p>
          <p>Case #: {caseNumber}</p>
          <p>Timestamp: {new Date().toLocaleString()}</p>
          <button
            onClick={() => setStep(1)}
            className="px-4 py-2 bg-primary text-white rounded"
          >
            New Miranda Event
          </button>
        </div>
      )}
    </div>
  );
};
async function translateMiranda(language: string): Promise<string> {
  const mirandaText = `You have the right to remain silent. Anything you say can and will be used against you in a court of law. You have the right to an attorney. If you cannot afford an attorney, one will be provided for you.`;

  if (language === 'english') return mirandaText;

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: mirandaText, targetLanguage: language }),
    });
    const data = await response.json();
    return data.translatedText || mirandaText;
  } catch {
    return mirandaText;
  }
}

import { voiceSynthesisService } from '../services/voice/VoiceSynthesisService';

async function speakMiranda(text: string) {
  try {
    await voiceSynthesisService.speak(text);
  } catch (err) {
    console.error('Error speaking Miranda:', err);
  }
}


export default MirandaWorkflow;