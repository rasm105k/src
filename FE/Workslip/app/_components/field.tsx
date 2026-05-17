export function Field({
  label,
  hint,
  error,
  children
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`field ${error ? "error" : ""}`}>
      <span className="field-label">{label}</span>
      {hint && <span className="hint">{hint}</span>}
      {children}
      {error && <span className="error-text">{error}</span>}
    </label>
  );
}
