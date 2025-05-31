import React, { useState } from 'react';
import { liveKitVoiceService } from '../services/livekit/LiveKitVoiceService';

interface MirandaLog {
  id: string;
  suspectName: string;
  dob: string;
  caseNumber: string;
  timestamp: number;
  officer: string;
  language: string;
  translation: string;
}

const MIRANDA_ENGLISH = `You have the right to remain silent. Anything you say can and will be used against you in a court of law. You have the right to an attorney. If you cannot afford an attorney, one will be provided for you.`;

const MirandaWorkflow: React.FC = () => {
  const [step, setStep] = useState(1);
  const [suspectName, setSuspectName] = useState('');
  const [dob, setDob] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [language, setLanguage] = useState('english');
  const [customLanguage, setCustomLanguage] = useState('');
  const [translation, setTranslation] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<MirandaLog[]>([]);

  const handleTranslateAndSpeak = async () => {
    setError('');
    setTranslation('');
    setIsSpeaking(true);
    const langToUse = language === 'other' ? customLanguage.trim() : language;
    try {
      let translatedText = MIRANDA_ENGLISH;
      if (langToUse.toLowerCase() !== 'english') {
        // Direct call to OpenRouter API from frontend
        const openrouterApiKey = import.meta.env.VITE_OPENROUTER_API_KEY || "";
        // DEBUG: Log OpenRouter API key at runtime (remove after testing)
        console.log('[DEBUG] VITE_OPENROUTER_API_KEY:', openrouterApiKey);
        const prompt = `Translate the following text to ${langToUse}:\n\n${MIRANDA_ENGLISH}`;
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openrouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:8080',
            'X-Title': 'LARK App'
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-pro-exp-03-25:free',
            messages: [
              { role: 'system', content: 'You are a professional legal translator.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 256
          })
        });
        const data = await response.json();
        if (response.ok && data.choices && data.choices[0]?.message?.content) {
          translatedText = data.choices[0].message.content.trim();
        } else {
          setError('Translation failed. Showing English.');
        }
      }
      setTranslation(translatedText);
      await liveKitVoiceService.speak(translatedText, 'ash');
      setStep(2);
    } catch (err) {
      setError('Translation or speech failed.');
      setTranslation(MIRANDA_ENGLISH);
    }
    setIsSpeaking(false);
  };

  const handleLog = async () => {
    const log: MirandaLog = {
      id: `${Date.now()}`,
      suspectName,
      dob,
      caseNumber,
      timestamp: Date.now(),
      officer: 'Officer Name', // TODO: Replace with actual officer info
      language: language === 'other' ? customLanguage.trim() : language,
      translation,
    };
    setLogs(prev => [...prev, log]);
    setStep(3);
    // Optionally send to backend here
  };

  // Collapsible sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div
      className={`flex flex-col h-full bg-card rounded-lg shadow-lg overflow-hidden transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'w-full' : 'w-16'
      }`}
      aria-label="Miranda Workflow"
    >
      <div className="flex-none p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold">Miranda Workflow</h2>
        <button
          className="p-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
          aria-label={sidebarOpen ? "Collapse Miranda Workflow" : "Expand Miranda Workflow"}
          aria-expanded={sidebarOpen}
          onClick={() => setSidebarOpen((open) => !open)}
        >
          <span aria-hidden="true">{sidebarOpen ? "⏴" : "⏵"}</span>
        </button>
      </div>
      <div className={`flex-1 p-4 space-y-4 overflow-y-auto ${sidebarOpen ? '' : 'hidden'}`}>
        {step === 1 && (
          <form className="space-y-4" autoComplete="off">
            <div className="space-y-2">
              <label htmlFor="miranda-language" className="block text-sm font-medium">Language</label>
              <select
                id="miranda-language"
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="english">English</option>
                <option value="spanish">Spanish</option>
                <option value="french">French</option>
                <option value="vietnamese">Vietnamese</option>
                <option value="mandarin">Mandarin</option>
                <option value="arabic">Arabic</option>
                <option value="other">Other</option>
              </select>
              {language === 'other' && (
                <>
                  <label htmlFor="miranda-custom-language" className="block text-sm font-medium">Custom Language</label>
                  <input
                    id="miranda-custom-language"
                    type="text"
                    value={customLanguage}
                    onChange={e => setCustomLanguage(e.target.value)}
                    placeholder="Enter language (e.g., Russian, Hindi)"
                    className="w-full px-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </>
              )}
            </div>
            <div>
              <label htmlFor="miranda-suspect-name" className="block text-sm font-medium">Suspect Name</label>
              <input
                id="miranda-suspect-name"
                value={suspectName}
                onChange={e => setSuspectName(e.target.value)}
                placeholder="Suspect Name"
                className="w-full px-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="miranda-dob" className="block text-sm font-medium">Date of Birth</label>
              <input
                id="miranda-dob"
                value={dob}
                onChange={e => setDob(e.target.value)}
                placeholder="Date of Birth"
                className="w-full px-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="miranda-case-number" className="block text-sm font-medium">Case Number</label>
              <input
                id="miranda-case-number"
                value={caseNumber}
                onChange={e => setCaseNumber(e.target.value)}
                placeholder="Case Number"
                className="w-full px-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button
              type="button"
              onClick={handleTranslateAndSpeak}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              disabled={isSpeaking}
            >
              {isSpeaking ? (
                <span className="animate-pulse">Speaking...</span>
              ) : (
                <span>Start Miranda Rights</span>
              )}
            </button>
          </form>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Miranda Rights (Review)</h2>
            <div className="p-4 bg-muted rounded-md">
              <p className="text-muted-foreground">{translation}</p>
            </div>
            <button
              onClick={handleLog}
              className="w-full px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 transition-colors"
            >
              Complete and Log
            </button>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Miranda Rights Logged</h2>
            <div className="p-4 bg-muted rounded-md space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <p className="text-sm text-muted-foreground">Suspect:</p>
                <p className="text-sm font-medium">{suspectName}</p>
                <p className="text-sm text-muted-foreground">DOB:</p>
                <p className="text-sm font-medium">{dob}</p>
                <p className="text-sm text-muted-foreground">Case #:</p>
                <p className="text-sm font-medium">{caseNumber}</p>
                <p className="text-sm text-muted-foreground">Timestamp:</p>
                <p className="text-sm font-medium">{new Date().toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Language:</p>
                <p className="text-sm font-medium">{language === 'other' ? customLanguage.trim() : language}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Translation:</p>
                <p className="text-sm">{translation}</p>
              </div>
            </div>
            <button
              onClick={() => setStep(1)}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              New Miranda Event
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MirandaWorkflow;