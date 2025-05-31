import React from "react";

export interface Suggestion {
  id: string;
  text: string;
  onClick: () => void;
}

interface SuggestionsBarProps {
  suggestions: Suggestion[];
  onDismiss: () => void;
}

const SuggestionsBar: React.FC<SuggestionsBarProps> = ({ suggestions, onDismiss }) => {
  if (!suggestions.length) return null;
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        background: "#f5f7fa",
        borderRadius: 8,
        padding: "8px 16px",
        margin: "12px 0",
        boxShadow: "0 1px 4px 0 #0001"
      }}
    >
      {suggestions.map((s) => (
        <button
          key={s.id}
          onClick={s.onClick}
          style={{
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "6px 14px",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 15
          }}
        >
          {s.text}
        </button>
      ))}
      <button
        onClick={onDismiss}
        style={{
          marginLeft: "auto",
          background: "none",
          border: "none",
          color: "#888",
          fontSize: 18,
          cursor: "pointer"
        }}
        aria-label="Dismiss suggestions"
        title="Dismiss"
      >
        ×
      </button>
    </div>
  );
};

export default SuggestionsBar;