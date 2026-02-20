interface SuggestionChipProps {
  text: string;
  onClick: (text: string) => void;
}

export function SuggestionChip({ text, onClick }: SuggestionChipProps) {
  return (
    <button
      onClick={() => onClick(text)}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-secondary/50 hover:bg-secondary hover:border-border transition-all duration-200 text-sm text-foreground/80 hover:text-foreground group"
    >
      <span className="flex-1 text-left">{text}</span>
      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground">
        +
      </span>
    </button>
  );
}

interface SuggestionChipsProps {
  onSelect: (text: string) => void;
}

export function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  const suggestions = [
    "Find papers about machine learning in telecommunications",
    "What research has been done on 5G network optimization?",
    "Show me recent thesis on cybersecurity",
    "Find papers by Dr. Budi Santoso about IoT",
    "What are the trending topics in computer science research?",
  ];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Try asking about research papers:
      </p>
      <div className="flex flex-col gap-2">
        {suggestions.map((suggestion, index) => (
          <SuggestionChip key={index} text={suggestion} onClick={onSelect} />
        ))}
      </div>
    </div>
  );
}
