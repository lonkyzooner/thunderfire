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

  useEffect(() => {
    localStorage.setItem('lark_saved_reports', JSON.stringify(savedReports));
  }, [savedReports]);
  const editorRef = useRef<HTMLDivElement>(null);

  const handleReview = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`
        },
        body: JSON.stringify({
          model: 'quasar-alpha',
          messages: [
            {
              role: 'user',
              content: `Please review this report and provide feedback:\n\n${reportText}`
            }
          ]
        }),
      });
      const data = await response.json();
      const feedback = data.choices?.[0]?.message?.content;
      setFeedback(feedback || 'No feedback generated.');
    } catch (err) {
      console.error('Error reviewing report:', err);
      setFeedback('Error reviewing report.');
    }
    setLoading(false);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold mb-4">Lark Report Assistant</h2>
      <div className="mb-4 space-y-2">
        <label className="block text-sm font-medium">Report Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter report title"
          className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <button
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition"
            onClick={async () => {
              setLoading(true);
              try {
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`
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
            Auto-generate Report
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
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">Saved Reports</h3>
        <ul className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-md p-2">
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
      <div className="mb-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Report Title"
          className="w-full border p-2 rounded mb-2"
        />
        <button
          onClick={() => {
            if (!title.trim() || !reportText.trim()) return;
            const newReport = { id: `${Date.now()}`, title, content: reportText };
            setSavedReports(prev => [...prev, newReport]);
            setTitle('');
            setReportText('');
            if (editorRef.current) editorRef.current.innerHTML = '';
          }}
          className="px-3 py-1 bg-primary text-white rounded"
        >
          Save Report
        </button>
      </div>
      <div className="mb-4">
        <h3 className="font-semibold mb-1">Saved Reports</h3>
        <ul className="space-y-1 max-h-40 overflow-y-auto border p-2 rounded">
          {savedReports.map(r => (
            <li key={r.id} className="flex justify-between items-center">
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
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => document.execCommand('bold')}
          className="px-2 py-1 border rounded text-sm hover:bg-primary/10"
        >
          Bold
        </button>
        <button
          onClick={() => document.execCommand('italic')}
          className="px-2 py-1 border rounded text-sm hover:bg-primary/10"
        >
          Italic
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="w-full h-60 border p-2 rounded overflow-y-auto"
        onInput={() => setReportText(editorRef.current?.innerText || '')}
      >
      </div>
      <div className="flex gap-2">
        <button
          onClick={async () => {
            setLoading(true);
            setFeedback(null);
            try {
              const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer REMOVED_SECRET'
                },
                body: JSON.stringify({
                  model: 'openrouter/quasar-alpha',
                  messages: [
                    {
                      role: 'user',
                      content: `You are an expert legal writing assistant. Carefully review the following police report.

Your response must be a **numbered list** (1., 2., 3., etc.) of **specific, actionable suggestions**.

For each item:
- **Quote or reference the exact sentence or section** that needs improvement.
- **Explain clearly why** it is problematic (e.g., grammar, clarity, professionalism).
- **Provide a concrete suggestion** to fix or improve it.

Be thorough but concise. Focus on clarity, professionalism, completeness, and proper grammar.

Report:
${reportText}`
                    }
                  ]
                }),
              });
              const data = await response.json();
              console.log('OpenRouter API response:', data);
              const feedback = data.choices?.[0]?.message?.content;
              if (editorRef.current) {
                editorRef.current.innerHTML = reportText; // Keep original text
              }
              if (data.error) {
                console.error('OpenRouter API error:', data.error);
                setFeedback(`Error: ${data.error.message || 'Unknown error'}`);
              } else if (feedback) {
                setFeedback(feedback);
              } else {
                console.warn('Unexpected OpenRouter API response:', data);
                setFeedback('No feedback generated.');
              }
            } catch (err) {
              console.error('Error reviewing report:', err);
              setFeedback('Error reviewing report.');
            }
            setLoading(false);
          }}
          disabled={loading || !reportText.trim()}
          className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
        >
          {loading ? 'Reviewing...' : 'Review & Highlight'}
        </button>
        <button
          onClick={() => {
            setReportText('');
            if (editorRef.current) editorRef.current.innerHTML = '';
            setFeedback(null);
          }}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          Clear
        </button>
      </div>
      {feedback && (
        <div className="p-3 border rounded bg-muted">
          <h3 className="font-semibold mb-2">Lark's Suggestions:</h3>
          <p>{feedback}</p>
        </div>
      )}
    </div>
  );
};

export default ReportAssistant;
