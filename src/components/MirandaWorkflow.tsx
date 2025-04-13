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
        const openrouterApiKey = "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";
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
            model: 'openai/gpt-4',
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
    <aside
      className={`transition-all duration-300 ease-in-out ${sidebarOpen ? 'max-w-md w-full' : 'max-w-xs w-16'} bg-white/90 rounded-2xl shadow border border-gray-200`}
      aria-label="Miranda Workflow Sidebar"
    >
      <button
        className="absolute left-2 top-2 z-10 bg-blue-100 hover:bg-blue-200 rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label={sidebarOpen ? "Collapse Miranda Workflow Sidebar" : "Expand Miranda Workflow Sidebar"}
        aria-expanded={sidebarOpen}
        onClick={() => setSidebarOpen((open) => !open)}
        tabIndex={0}
      >
        <span aria-hidden="true">{sidebarOpen ? "⏴" : "⏵"}</span>
      </button>
      <div className={`p-4 space-y-6 ${sidebarOpen ? '' : 'hidden'}`}>
        {step === 1 && (
          <form className="space-y-5" autoComplete="off">
            <h2 className="text-lg font-semibold mb-2">Miranda Workflow</h2>
            <div className="space-y-2">
              <label htmlFor="miranda-language" className="block text-sm font-medium">Language</label>
              <select
                id="miranda-language"
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full rounded-md border border-border bg-white/70 text-foreground px-3 py-2 font-medium focus:ring-2 focus:ring-primary/40 transition-all"
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
                    className="w-full rounded-md border border-border bg-white/70 text-foreground px-3 py-2 font-medium focus:ring-2 focus:ring-primary/40 transition-all mt-2"
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
                className="w-full rounded-md border border-border bg-white/70 text-foreground px-3 py-2 font-medium focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>
            <div>
              <label htmlFor="miranda-dob" className="block text-sm font-medium">Date of Birth</label>
              <input
                id="miranda-dob"
                value={dob}
                onChange={e => setDob(e.target.value)}
                placeholder="Date of Birth"
                className="w-full rounded-md border border-border bg-white/70 text-foreground px-3 py-2 font-medium focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>
            <div>
              <label htmlFor="miranda-case-number" className="block text-sm font-medium">Case Number</label>
              <input
                id="miranda-case-number"
                value={caseNumber}
                onChange={e => setCaseNumber(e.target.value)}
                placeholder="Case Number"
                className="w-full rounded-md border border-border bg-white/70 text-foreground px-3 py-2 font-medium focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button
              type="button"
              onClick={handleTranslateAndSpeak}
              className="w-full py-3 rounded-md font-heading font-bold text-base bg-blue-600 hover:bg-blue-700 text-white shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isSpeaking}
            >
              {isSpeaking ? <span className="animate-pulse">Speaking...</span> : <span>Start Miranda Rights</span>}
            </button>
          </form>
        )}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold mb-2">Miranda Rights (Review)</h2>
            <div className="bg-white/60 rounded-md p-4 shadow-inner border border-border/40 space-y-2 text-base font-medium text-foreground">
              <p>{translation}</p>
            </div>
            <button
              onClick={handleLog}
              className="w-full py-3 rounded-md font-heading font-bold text-base bg-green-600 hover:bg-green-700 text-white shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              Complete and Log
            </button>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold mb-2">Miranda Rights Logged</h2>
            <div className="bg-white/60 rounded-md p-4 shadow-inner border border-border/40 space-y-1 text-base font-medium text-foreground">
              <p>Suspect: {suspectName}</p>
              <p>DOB: {dob}</p>
              <p>Case #: {caseNumber}</p>
              <p>Timestamp: {new Date().toLocaleString()}</p>
              <p>Language: {language === 'other' ? customLanguage.trim() : language}</p>
              <p>Translation: {translation}</p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="w-full py-3 rounded-md font-heading font-bold text-base bg-blue-600 hover:bg-blue-700 text-white shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              New Miranda Event
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default MirandaWorkflow;