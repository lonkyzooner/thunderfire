import React, { useState, useRef, useEffect } from 'react';

const ReportAssistant: React.FC = () => {
  const [reportText, setReportText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedReports, setSavedReports] = useState<{ id: string; title: string; content: string }[]>(() => {
    const saved = localStorage.getItem('lark_saved_reports');
    return saved ? JSON.parse(saved) : [];
  });
  const [title, setTitle] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('lark_saved_reports', JSON.stringify(savedReports));
  }, [savedReports]);

  return (
    <div className="p-4 space-y-6 bg-white/90 rounded-2xl shadow border border-gray-200">
      <h2 className="text-lg font-semibold mb-4">Lark Report Assistant</h2>
      <div className="mb-4 space-y-2">
        <label className="block text-sm font-medium">Report Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter report title"
          className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div className="mb-4 space-y-2">
        <label className="block text-sm font-medium">Report Content</label>
        <textarea
          value={reportText}
          onChange={(e) => setReportText(e.target.value)}
          placeholder="Enter or edit the incident report here..."
          rows={8}
          className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-vertical"
        />
        {feedback && (
          <div className="mt-2 p-2 rounded bg-blue-50 border border-blue-200 text-blue-900 text-sm">
            {feedback}
          </div>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition"
          onClick={async () => {
            setLoading(true);
            setFeedback(null);
            try {
              const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                  model: 'quasar-alpha',
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
        >
          {loading ? "Generating..." : "Auto-generate Report"}
        </button>
        <button
          onClick={async () => {
            setLoading(true);
            setFeedback(null);
            try {
              // Lark persona system prompt (from larkAgent.ts)
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
                  model: 'openrouter/quasar-alpha',
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
              } else {
                setFeedback('No feedback generated.');
              }
            } catch (err) {
              console.error('Error reviewing report:', err);
              setFeedback('Error reviewing report.');
            }
            setLoading(false);
          }}
          className="px-4 py-2 rounded-md bg-yellow-600 hover:bg-yellow-500 text-white transition"
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
          className="px-4 py-2 rounded-md bg-primary hover:bg-primary/90 text-white transition"
        >
          Save Report
        </button>
      </div>
      {feedback && (
        <div className="mt-4 p-3 border rounded bg-blue-50 border-blue-200">
          <h3 className="font-semibold mb-2">Report Review Suggestions:</h3>
          <div className="whitespace-pre-line text-sm">{feedback}</div>
          <button
            className="mt-2 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs"
            onClick={() => setFeedback(null)}
          >
            Clear Review
          </button>
        </div>
      )}
      <div className="mt-6 border-t pt-4">
        <h3 className="font-semibold mb-2">Saved Reports</h3>
        <ul className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-md p-2 bg-gray-50">
          {savedReports.map(r => (
            <li key={r.id} className="flex justify-between items-center border-b border-border pb-1">
              <span className="truncate">{r.title}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setReportText(r.content);
                    if (editorRef.current) editorRef.current.innerHTML = r.content;
                    setTitle(r.title);
                  }}
                  className="text-xs px-2 py-1 border rounded hover:bg-primary/10"
                >
                  Load
                </button>
                <button
                  onClick={() => setSavedReports(prev => prev.filter(x => x.id !== r.id))}
                  className="text-xs px-2 py-1 border rounded hover:bg-red-100/10"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ReportAssistant;
