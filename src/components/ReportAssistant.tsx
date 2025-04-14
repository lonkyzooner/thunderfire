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
    <div className="flex flex-col h-full bg-card rounded-lg shadow-lg overflow-hidden">
      <div className="flex-none p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Lark Report Assistant</h2>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Report Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter report title"
            className="w-full px-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Report Content</label>
          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="Enter or edit the incident report here..."
            rows={8}
            className="w-full px-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-vertical"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
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
                    model: 'openai/gpt-4.1-nano',
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
                    model: 'openai/gpt-4.1-nano',
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
            className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors disabled:opacity-50"
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
            className="px-4 py-2 rounded-md bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            Save Report
          </button>
        </div>
        {feedback && (
          <div className="p-4 rounded-md bg-muted">
            <h3 className="font-semibold mb-2 text-foreground">Report Review Suggestions:</h3>
            <div className="whitespace-pre-line text-sm text-muted-foreground">{feedback}</div>
            <button
              className="mt-2 px-3 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 text-xs transition-colors"
              onClick={() => setFeedback(null)}
            >
              Clear Review
            </button>
          </div>
        )}
        <div className="mt-6 border-t border-border pt-4">
          <h3 className="font-semibold mb-2 text-foreground">Saved Reports</h3>
          <ul className="space-y-2 max-h-48 overflow-y-auto rounded-md p-2 bg-muted">
            {savedReports.map(r => (
              <li key={r.id} className="flex justify-between items-center border-b border-border/50 pb-1">
                <span className="truncate text-foreground">{r.title}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setReportText(r.content);
                      if (editorRef.current) editorRef.current.innerHTML = r.content;
                      setTitle(r.title);
                    }}
                    className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => setSavedReports(prev => prev.filter(x => x.id !== r.id))}
                    className="text-xs px-2 py-1 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
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
