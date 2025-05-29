import React, { useState, useRef, useEffect } from 'react';
import { useLiveKitVoice } from '../hooks/useLiveKitVoice';

const ReportAssistant = (): JSX.Element => {
  const [reportText, setReportText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedReports, setSavedReports] = useState<{ id: string; title: string; content: string }[]>(() => {
    const saved = localStorage.getItem('lark_saved_reports');
    return saved ? JSON.parse(saved) : [];
  });
  const [title, setTitle] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  const { speak, stopSpeaking } = useLiveKitVoice();

  useEffect(() => {
    localStorage.setItem('lark_saved_reports', JSON.stringify(savedReports));
  }, [savedReports]);

  return (
    <div>
      <div>
        <h2>Lark Report Assistant</h2>
      </div>
      <div>
        <div>
          <label>Report Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter report title"

          />
        </div>
        <div>
          <label>Report Content</label>
          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="Enter or edit the incident report here..."
            rows={8}

          />
        </div>
        <div>
          <button

            onClick={async () => {
              setLoading(true);
              setFeedback(null);
              try {
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'LARK Report Assistant'
                  },
                  body: JSON.stringify({
                    model: 'google/gemini-2.5-pro-exp-03-25:free',
                    messages: [
                      {
                        role: 'user',
                        content: 'Generate a detailed police incident report draft based on the recent conversation and incident data.'
                      }
                    ]
                  }),
                });
                const data = await response.json();
                const generated = data.choices?.[0]?.message?.content;
                setReportText(generated || 'No report generated.');
              } catch (err) {
                console.error('Error generating report:', err);
              }
              setLoading(false);
            }}
            disabled={loading}
          >
            {loading ? "Generating..." : "Auto-generate Report"}
          </button>
          <button
            onClick={async () => {
              setLoading(true);
              setFeedback(null);
              try {
                const larkSystemPrompt = `You are LARK (Law Enforcement Assistance and Response Kit), an AI assistant integrated into a wearable device for solo law enforcement in Louisiana, acting as a legal and tactical advisor. You are authoritative yet supportive, mirroring the clarity and steadiness of voice. Maintain a concise, factual, and law-focused style to ensure officers can trust your guidance in high-pressure situations. Prioritize officer safety tactics and basic first aid and care. Avoid humor or casual language, prioritizing precision and legal accuracy, especially when delivering legal information or reviewing reports.`;

                const reviewInstructions = `Carefully review the following police report as LARK. Your response must be a **numbered list** (1., 2., 3., etc.) of **specific, actionable suggestions**.

For each item:
- **Quote or reference the exact sentence or section** that needs improvement.
- **Explain clearly why** it is problematic (e.g., grammar, clarity, professionalism, legal accuracy).
- **Provide a concrete suggestion** to fix or improve it.

Be thorough but concise. Focus on clarity, professionalism, completeness, and proper grammar. Use the LARK persona and style. If the report is already clear, professional, and complete, say so.

Report:
${reportText}`;

                const response = await fetch('/api/openrouter', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    model: 'google/gemini-2.5-pro-exp-03-25:free',
                    messages: [
                      {
                        role: 'system',
                        content: larkSystemPrompt
                      },
                      {
                        role: 'user',
                        content: reviewInstructions
                      }
                    ]
                  }),
                });
                const data = await response.json();
                const feedback = data.choices?.[0]?.message?.content;
                if (data.error) {
                  setFeedback(`Error: ${data.error.message || 'Unknown error'}`);
                } else if (feedback) {
                  setFeedback(feedback);
                  stopSpeaking();
                  speak(feedback);
                } else {
                  setFeedback('No feedback generated.');
                }
              } catch (err) {
                console.error('Error reviewing report:', err);
                setFeedback('Error reviewing report.');
              }
              setLoading(false);
            }}

            disabled={loading}
          >
            {loading ? "Reviewing..." : "Review Report"}
          </button>
          <button
            onClick={() => {
              if (!title.trim() || !reportText.trim()) return;
              const newReport = { id: `${Date.now()}`, title, content: reportText };
              setSavedReports(prev => [...prev, newReport]);
              setTitle('');
              setReportText('');
              if (editorRef.current) editorRef.current.innerHTML = '';
            }}

          >
            Save Report
          </button>
        </div>
        {feedback && (
          <div>
            <h3>Report Review Suggestions:</h3>
            <div>{feedback}</div>
            <button

              onClick={() => setFeedback(null)}
            >
              Clear Review
            </button>
          </div>
        )}
        <div>
          <h3>Saved Reports</h3>
          <ul>
            {savedReports.map(r => (
              <li key={r.id}>
                <span>{r.title}</span>
                <div>
                  <button
                    onClick={() => {
                      setReportText(r.content);
                      if (editorRef.current) editorRef.current.innerHTML = r.content;
                      setTitle(r.title);
                    }}

                  >
                    Load
                  </button>
                  <button
                    onClick={() => setSavedReports(prev => prev.filter(x => x.id !== r.id))}

                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export { ReportAssistant };
export default ReportAssistant;
