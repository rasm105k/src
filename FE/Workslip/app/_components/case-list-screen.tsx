import { BriefcaseBusiness, Plus } from "lucide-react";
import type { WorkslipCase, WorkslipDraft } from "../../lib/demo-cases";
import { CaseCard } from "./case-card";

export function CaseListScreen({
  cases,
  draftsByCaseId,
  onOpenCase,
  onCreateCase
}: {
  cases: WorkslipCase[];
  draftsByCaseId: Record<string, WorkslipDraft>;
  onOpenCase: (caseId: string) => void;
  onCreateCase: () => void;
}) {
  const openCases = cases.filter((item) => item.status !== "submitted").length;

  return (
    <div className="case-list-screen">
      <div className="case-list-hero">
        <div className="case-list-icon">
          <BriefcaseBusiness size={22} strokeWidth={2.6} />
        </div>
        <div>
          <h1>Sager</h1>
          <p className="lead">{openCases} åbne sager. Vælg en sag, eller opret en ny 4V05-rapport.</p>
        </div>
      </div>

      <div className="case-list">
        {cases.map((item) => (
          <CaseCard
            key={item.caseId}
            item={item}
            draft={draftsByCaseId[item.caseId]}
            onOpen={() => onOpenCase(item.caseId)}
          />
        ))}
      </div>

      <button className="create-case-inline" type="button" onClick={onCreateCase}>
        <Plus size={18} strokeWidth={2.7} />
        Opret sag
      </button>
    </div>
  );
}
