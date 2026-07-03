/**
 * ChoiceInput Component
 *
 * Fully controlled single-choice (radio) or multi-choice (checkbox) inputs.
 */

"use client";

interface ChoiceInputProps {
  label: string;
  options: string[];
  value: string | string[];
  onChange: (value: unknown) => void;
  multiple: boolean;
  error?: string;
}

export function ChoiceInput({ label, options, value, onChange, multiple, error }: ChoiceInputProps) {
  const handleSingle = (option: string) => {
    onChange(option);
  };

  const handleMultiple = (option: string) => {
    const current = Array.isArray(value) ? value : [];
    const next = current.includes(option)
      ? current.filter((o) => o !== option)
      : [...current, option];
    onChange(next);
  };

  if (multiple) {
    return (
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground mb-1">{label}</legend>
        {options.map((option) => {
          const isChecked = Array.isArray(value) && value.includes(option);
          return (
            <label
              key={option}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                isChecked
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => handleMultiple(option)}
                className="w-4 h-4 text-primary accent-primary"
              />
              <span className="text-sm">{option}</span>
            </label>
          );
        })}
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </fieldset>
    );
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-foreground mb-1">{label}</legend>
      {options.map((option) => {
        const isSelected = value === option;
        return (
          <label
            key={option}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <input
              type="radio"
              name={label}
              checked={isSelected}
              onChange={() => handleSingle(option)}
              className="w-4 h-4 text-primary accent-primary"
            />
            <span className="text-sm">{option}</span>
          </label>
        );
      })}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </fieldset>
  );
}
