export function StepFrame({
  title,
  lead,
  callout,
  children
}: {
  title: string;
  lead?: string;
  callout?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <h1>{title}</h1>
      {lead && <p className="lead">{lead}</p>}
      {callout && (
        <div className="callout">
          <span>{callout}</span>
        </div>
      )}
      <div className="form">{children}</div>
    </>
  );
}
