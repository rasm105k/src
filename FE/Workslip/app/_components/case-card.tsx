import { CalendarDays, ChevronRight } from "lucide-react";
import type { WorkslipCase, WorkslipCaseStatus, WorkslipDraft } from "../../lib/demo-cases";
import { getDraftProgress } from "../../lib/demo-cases";

export function CaseCard({
  item,
  draft,
  onOpen
}: {
  item: WorkslipCase;
  draft?: WorkslipDraft;
  onOpen: () => void;
}) {
  const progress = draft ? getDraftProgress(draft) : null;
  const description = draft?.description || item.taskDescription || "Ingen opgavebeskrivelse endnu";

  return (
    <article className={`case-card ${item.priority === "urgent" ? "urgent" : ""}`}>
      <button type="button" onClick={onOpen} className="case-card-button">
        <div className="case-card-top">
          <div>
            <span className="case-number">{item.caseNumber}</span>
            <h2>{draft?.customerName || item.customerName || "Ny kunde"}</h2>
          </div>
          <CaseStatusPill status={item.status} />
        </div>
        <p className="case-address">{draft?.address || item.address || "Adresse mangler"}</p>
        <p className="case-description">{description}</p>
        <div className="case-card-meta">
          <span>
            <CalendarDays size={14} strokeWidth={2.5} />
            {formatCaseDate(draft?.date || item.scheduledDate)}
          </span>
          {item.priority === "urgent" && <strong>Haster</strong>}
          {progress && <span>{progress.label} udfyldt</span>}
        </div>
        <div className="case-card-action">
          <span>Åbn sag</span>
          <ChevronRight size={17} strokeWidth={2.7} />
        </div>
      </button>
    </article>
  );
}

export function CaseStatusPill({ status }: { status: WorkslipCaseStatus }) {
  const label: Record<WorkslipCaseStatus, string> = {
    open: "Åben",
    draft: "Kladde",
    submitted: "Indsendt"
  };

  return <span className={`case-status ${status}`}>{label[status]}</span>;
}

export function formatCaseDate(value: string) {
  return new Date(value).toLocaleDateString("da-DK", {
    day: "2-digit",
    month: "short"
  });
}
