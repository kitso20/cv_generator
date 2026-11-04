import React, { useEffect, useRef, useState } from 'react';

interface CommaSeparatedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  /** Canonical list value from the resume model. */
  items: string[] | undefined;
  /** Commit the parsed list upstream. Already trimmed; empty entries removed. */
  onCommit: (items: string[]) => void;
}

const parseList = (value: string): string[] =>
  value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

/**
 * A comma-separated list editor that does NOT fight the user while they type.
 *
 * The displayed text is local state; the parent receives the parsed list on
 * every change. When the user is not focused, external changes (import, ATS
 * auto-format, undo) are reflected back into the field. Blurring normalizes
 * the display ("SAP, Power BI," -> "SAP, Power BI").
 */
export const CommaSeparatedInput: React.FC<CommaSeparatedInputProps> = ({
  items,
  onCommit,
  ...rest
}) => {
  const [text, setText] = useState<string>(() => (items ?? []).join(', '));
  const focusedRef = useRef(false);

  // Reflect external changes only while the user is not editing.
  useEffect(() => {
    if (!focusedRef.current) {
      setText((items ?? []).join(', '));
    }
  }, [items]);

  return (
    <input
      type="text"
      {...rest}
      value={text}
      onFocus={(e) => {
        focusedRef.current = true;
        rest.onFocus?.(e);
      }}
      onChange={(e) => {
        const value = e.target.value;
        setText(value);
        onCommit(parseList(value));
      }}
      onBlur={(e) => {
        focusedRef.current = false;
        const parsed = parseList(text);
        setText(parsed.join(', '));
        onCommit(parsed);
        rest.onBlur?.(e);
      }}
    />
  );
};
