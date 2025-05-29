import React, { useState } from 'react';
import { openAIVoiceService } from '../services/voice/OpenAIVoiceService';
import { useUserDepartment } from '../contexts/UserDepartmentContext';

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
  const { user } = useUserDepartment();
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
        const openrouterApiKey = import.meta.env.VITE_OPENROUTER_API_KEY || "";
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
      await openAIVoiceService.speak(translatedText, 'ash');
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
      officer: `${user.rank} ${user.name}` || 'Officer Unknown',
      language: language === 'other' ? customLanguage.trim() : language,
      translation,
    };
    setLogs(prev => [...prev, log]);
    setStep(3);
  };

  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div
      style={{
        width: sidebarOpen ? '100%' : '4rem',
        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif'
      }}
      aria-label="Miranda Workflow"
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
        backgroundColor: '#1e40af',
        color: 'white',
        borderRadius: '8px 8px 0 0'
      }}>
        <h2 style={{ margin: '0', fontSize: '18px', fontWeight: '600' }}>Miranda Workflow</h2>
        <button
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '4px'
          }}
          aria-label={sidebarOpen ? "Collapse Miranda Workflow" : "Expand Miranda Workflow"}
          aria-expanded={sidebarOpen}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <span aria-hidden="true">{sidebarOpen ? "⏴" : "⏵"}</span>
        </button>
      </div>
      
      <div style={{
        padding: sidebarOpen ? '20px' : '0',
        display: sidebarOpen ? 'block' : 'none',
        backgroundColor: '#f8fafc',
        borderRadius: '0 0 8px 8px'
      }}>
        {step === 1 && (
          <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} autoComplete="off">
            <div>
              <label htmlFor="miranda-language" style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontWeight: '500',
                color: '#374151'
              }}>
                Language
              </label>
              <select
                id="miranda-language"
                value={language}
                onChange={e => setLanguage(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
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
                <div style={{ marginTop: '12px' }}>
                  <label htmlFor="miranda-custom-language" style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Custom Language
                  </label>
                  <input
                    id="miranda-custom-language"
                    type="text"
                    value={customLanguage}
                    onChange={e => setCustomLanguage(e.target.value)}
                    placeholder="Enter language (e.g., Russian, Hindi)"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              )}
            </div>
            
            <div>
              <label htmlFor="miranda-suspect-name" style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontWeight: '500',
                color: '#374151'
              }}>
                Suspect Name
              </label>
              <input
                id="miranda-suspect-name"
                value={suspectName}
                onChange={e => setSuspectName(e.target.value)}
                placeholder="Suspect Name"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div>
              <label htmlFor="miranda-dob" style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontWeight: '500',
                color: '#374151'
              }}>
                Date of Birth
              </label>
              <input
                id="miranda-dob"
                value={dob}
                onChange={e => setDob(e.target.value)}
                placeholder="Date of Birth"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div>
              <label htmlFor="miranda-case-number" style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontWeight: '500',
                color: '#374151'
              }}>
                Case Number
              </label>
              <input
                id="miranda-case-number"
                value={caseNumber}
                onChange={e => setCaseNumber(e.target.value)}
                placeholder="Case Number"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            {error && (
              <div style={{
                padding: '12px',
                backgroundColor: '#fee2e2',
                border: '2px solid #fca5a5',
                borderRadius: '8px',
                color: '#991b1b',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}
            
            <button
              type="button"
              onClick={handleTranslateAndSpeak}
              disabled={isSpeaking}
              style={{
                padding: '14px 20px',
                backgroundColor: isSpeaking ? '#9ca3af' : '#1e40af',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isSpeaking ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {isSpeaking ? 'Speaking...' : 'Start Miranda Rights'}
            </button>
          </form>
        )}
        
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#1e40af' }}>
              Miranda Rights (Review)
            </h2>
            <div style={{
              padding: '16px',
              backgroundColor: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '15px',
              lineHeight: '1.6'
            }}>
              <p style={{ margin: '0' }}>{translation}</p>
            </div>
            <button
              onClick={handleLog}
              style={{
                padding: '14px 20px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Complete and Log
            </button>
          </div>
        )}
        
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#10b981' }}>
              Miranda Rights Logged
            </h2>
            <div style={{
              padding: '16px',
              backgroundColor: 'white',
              border: '2px solid #10b981',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', fontSize: '14px' }}>
                <span style={{ fontWeight: '600' }}>Suspect:</span>
                <span>{suspectName}</span>
                <span style={{ fontWeight: '600' }}>DOB:</span>
                <span>{dob}</span>
                <span style={{ fontWeight: '600' }}>Case #:</span>
                <span>{caseNumber}</span>
                <span style={{ fontWeight: '600' }}>Officer:</span>
                <span>{`${user.rank} ${user.name}` || 'Officer Unknown'}</span>
                <span style={{ fontWeight: '600' }}>Timestamp:</span>
                <span>{new Date().toLocaleString()}</span>
                <span style={{ fontWeight: '600' }}>Language:</span>
                <span>{language === 'other' ? customLanguage.trim() : language}</span>
              </div>
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                <span style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>Translation:</span>
                <p style={{ margin: '0', fontSize: '14px', lineHeight: '1.5' }}>{translation}</p>
              </div>
            </div>
            <button
              onClick={() => setStep(1)}
              style={{
                padding: '14px 20px',
                backgroundColor: '#1e40af',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
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
