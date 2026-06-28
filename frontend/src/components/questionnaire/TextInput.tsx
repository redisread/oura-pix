/**
 * TextInput Component
 *
 * Text input/textarea for questionnaire text-type questions.
 */

"use client";

interface TextInputProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  error?: string;
}

export function TextInput({ label, value = "", onChange, placeholder, multiline = false, error }: TextInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground block">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}