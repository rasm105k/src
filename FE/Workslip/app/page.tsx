"use client";

import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileSignature,
  PenLine,
  Wrench
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  closureFlags,
  controlColumns,
  controlStages,
  getControlColumnsForInstallations,
  installationTypes,
  workKinds,
  type ActiveControlColumn,
  type ClosureFlag,
  type ControlItem,
  type ControlStage,
  type InstallationType,
  type WorkKind
} from "../lib/4v05-schema";

type StepId =
  | "report"
  | "categories"
  | "controls"
  | "closure"
  | "signature"
  | "done";

const stepOrder: StepId[] = ["report", "categories", "controls", "closure", "signature", "done"];

const nextLabels: Record<StepId, string> = {
  report: "Kategorier",
  categories: "Kontrol",
  controls: "Afslutning",
  closure: "Underskrift",
  signature: "Send",
  done: "Færdig"
};

const initialControlValues = Object.fromEntries(
  controlStages.flatMap((stage) =>
    Object.values(stage.items)
      .flat()
      .filter(Boolean)
      .map((item) => [item.id, false])
  )
);

export default function Home() {
  const [currentStep, setCurrentStep] = useState<StepId>("report");
  const [selectedInstallations, setSelectedInstallations] = useState<InstallationType[]>([]);
  const [workKind, setWorkKind] = useState<WorkKind | null>(null);
  const [customWorkKind, setCustomWorkKind] = useState("");
  const [controlValues, setControlValues] = useState<Record<string, boolean>>(initialControlValues);
  const [expandedControlStages, setExpandedControlStages] = useState<string[]>([]);
  const [customerInfoExpanded, setCustomerInfoExpanded] = useState(false);
  const [closure, setClosure] = useState<ClosureFlag[]>(["faerdig", "driftVedligehold", "klarTilFaktura"]);
  const [showDescriptionError, setShowDescriptionError] = useState(false);
  const [description, setDescription] = useState("");

  const currentIndex = stepOrder.indexOf(currentStep);
  const stepCount = stepOrder.length - 1;
  const stepText = currentStep === "done" ? "Færdig" : `Trin ${currentIndex + 1} af ${stepCount}`;
  const progress = currentStep === "done" ? 100 : Math.max(8, (currentIndex / stepCount) * 100);

  const activeControlColumnIds = useMemo(
    () => getControlColumnsForInstallations(selectedInstallations),
    [selectedInstallations]
  );

  const activeControlColumns = useMemo(
    () => controlColumns.filter((column) => activeControlColumnIds.includes(column.id)),
    [activeControlColumnIds]
  );

  const selectedInstallationLabels = useMemo(
    () =>
      installationTypes
        .filter((installation) => selectedInstallations.includes(installation.id))
        .map((installation) => installation.shortLabel),
    [selectedInstallations]
  );

  const selectedWorkKind = workKinds.find((kind) => kind.id === workKind);

  const visibleStages = useMemo(
    () =>
      controlStages.filter((stage) =>
        activeControlColumnIds.some((column) => (stage.items[column]?.length ?? 0) > 0)
      ),
    [activeControlColumnIds]
  );

  function goNext() {
    if (currentStep === "report" && description.trim().length === 0) {
      setShowDescriptionError(true);
      return;
    }

    if (currentStep === "done") {
      setCurrentStep("report");
      return;
    }

    setCurrentStep(stepOrder[Math.min(currentIndex + 1, stepOrder.length - 1)]);
  }

  function goBack() {
    setCurrentStep(stepOrder[Math.max(currentIndex - 1, 0)]);
  }

  function toggleInstallation(id: InstallationType) {
    setSelectedInstallations((current) => {
      if (current.includes(id)) {
        return current.length === 1 ? current : current.filter((item) => item !== id);
      }

      return [...current, id];
    });
  }

  function toggleControlItem(itemId: string) {
    setControlValues((current) => ({ ...current, [itemId]: !current[itemId] }));
  }

  function toggleControlStage(stageId: string) {
    setExpandedControlStages((current) =>
      current.includes(stageId) ? current.filter((id) => id !== stageId) : [...current, stageId]
    );
  }

  function toggleClosureFlag(id: ClosureFlag) {
    setClosure((current) => {
      if (id === "ikkeFaerdig") {
        return current.includes("ikkeFaerdig") ? [] : ["ikkeFaerdig"];
      }

      const withoutConflict = current.filter((flag) => flag !== "ikkeFaerdig");
      if (withoutConflict.includes(id)) {
        return withoutConflict.filter((flag) => flag !== id);
      }

      return [...withoutConflict, id];
    });
  }

  const primaryLabel =
    currentStep === "signature" ? "Send til kontoret" : currentStep === "done" ? "Ny rapport" : "Fortsæt";

  return (
    <main className="app-shell">
      <section className="phone" aria-label="4V05 Workslip demo">
        <header className="app-header">
          <div className="topline">
            <button
              className="back-button"
              type="button"
              aria-label="Gå tilbage"
              onClick={goBack}
              disabled={currentStep === "report" || currentStep === "done"}
            >
              <ArrowLeft size={21} strokeWidth={2.4} />
            </button>
            <div className="meta">
              <span>{stepText}</span>
              <strong>4V05</strong>
            </div>
          </div>
          <div className="progress" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
        </header>

        <div className="screen">
          {currentStep === "report" && (
            <StepFrame
              title="4V05 arbejdsrapport"
              lead="Kundens faktiske skema starter med kunde, adresse, kontaktperson, dato, rapportnummer og opgavebeskrivelse."
              callout="Gas-, vand- og sanitetsinstallationer samt servicearbejder på vand- og sanitetsinstallationer."
            >
              <Field label="Kunde">
                <input defaultValue="Aarhus Ejendomme ApS" autoComplete="organization" />
              </Field>
              <Field label="Adresse">
                <input defaultValue="Trøjborgvej 12, 8200 Aarhus N" autoComplete="street-address" />
              </Field>
              <div className="two-column">
                <Field label="Kontaktperson">
                  <input defaultValue="Mette Jensen" autoComplete="name" />
                </Field>
                <Field label="Tlf.">
                  <input defaultValue="26 75 09 81" inputMode="tel" autoComplete="tel" />
                </Field>
              </div>
              <div className="two-column">
                <Field label="Dato">
                  <input type="date" defaultValue="2026-05-15" />
                </Field>
                <Field label="Rapportnummer">
                  <input defaultValue="4V05-001" inputMode="numeric" />
                </Field>
              </div>
              <Field
                label="Opgavebeskrivelse"
                hint="Beskriv sagen kort, så kontrollen senere kan kobles til opgaven."
                error={showDescriptionError ? "Skriv en opgavebeskrivelse før du går videre." : undefined}
              >
                <textarea
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    if (event.target.value.trim().length > 0) setShowDescriptionError(false);
                  }}
                  placeholder="Skriv opgavebeskrivelse..."
                />
              </Field>
              <section className={`foldable-field ${customerInfoExpanded ? "expanded" : ""}`}>
                <button
                  className="foldable-header"
                  type="button"
                  aria-expanded={customerInfoExpanded}
                  onClick={() => setCustomerInfoExpanded((expanded) => !expanded)}
                >
                  <span>Oplysninger til kunden / tekniske observationer</span>
                  <ChevronDown size={20} strokeWidth={2.5} />
                </button>
                {customerInfoExpanded && (
                  <Field
                    label="Oplysninger"
                    hint="Brug feltet til observationer, råd eller tekniske forhold kunden skal kende."
                  >
                    <textarea placeholder="Skriv oplysninger til kunden eller tekniske observationer..." />
                  </Field>
                )}
              </section>
            </StepFrame>
          )}

          {currentStep === "categories" && (
            <StepFrame
              title="Kategorier"
              lead="Vælg anlægstype og arbejdstype hurtigt. Kontrolskemaet tilpasses automatisk bagefter."
            >
              <section className="category-panel" aria-labelledby="installation-category">
                <div className="section-heading">
                  <h2 id="installation-category">Anlægstype</h2>
                  <p>Vælg en eller flere fra kundens 4V05-skema.</p>
                </div>
                <div className="chip-grid" aria-label="Anlægstype">
                  {installationTypes.map((installation) => {
                    const active = selectedInstallations.includes(installation.id);

                    return (
                      <button
                        key={installation.id}
                        className={`chip ${active ? "active" : ""}`}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleInstallation(installation.id)}
                      >
                        <span>{active && <Check size={15} strokeWidth={3} />}</span>
                        <strong>{installation.shortLabel}</strong>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="category-panel" aria-labelledby="work-kind-category">
                <div className="section-heading">
                  <h2 id="work-kind-category">Arbejdstype</h2>
                  <p>Vælg den ene kategori der bedst passer.</p>
                </div>
                <div className="chip-grid work-kind-grid" role="radiogroup" aria-label="Arbejdstype">
                  {workKinds.map((kind) => (
                    <button
                      key={kind.id}
                      className={`chip radio-chip ${workKind === kind.id ? "active" : ""}`}
                      type="button"
                      role="radio"
                      aria-checked={workKind === kind.id}
                      onClick={() => setWorkKind(kind.id)}
                    >
                      <strong>{kind.shortLabel}</strong>
                    </button>
                  ))}
                </div>
                {selectedWorkKind && selectedWorkKind.helper && (
                  <div className="selected-helper">
                    <strong>{selectedWorkKind.label}</strong>
                    <span>{selectedWorkKind.helper}</span>
                  </div>
                )}
                {selectedWorkKind?.requiresCustomText && (
                  <Field label="Ret opgavetype" hint="Skriv den tekst der skal stå på arbejdssedlen.">
                    <input
                      value={customWorkKind}
                      onChange={(event) => setCustomWorkKind(event.target.value)}
                      placeholder="Fx serviceeftersyn, fejlsøgning eller rådgivning"
                    />
                  </Field>
                )}
              </section>
            </StepFrame>
          )}

          {currentStep === "controls" && (
            <StepFrame
              title="Kontrol"
              lead="Kontrolpunkterne er foldet ind fra start. Åbn en kategori og sæt flueben ved det, du har kontrolleret."
            >
              <div className="selected-columns" aria-label="Valgte anlægstyper">
                {activeControlColumns.map((column) => (
                  <span key={column.id}>{column.label}</span>
                ))}
              </div>
              <div className="control-stages">
                {visibleStages.map((stage) => (
                  <ControlStageCard
                    key={stage.id}
                    stage={stage}
                    columns={activeControlColumnIds}
                    expanded={expandedControlStages.includes(stage.id)}
                    values={controlValues}
                    onToggleStage={() => toggleControlStage(stage.id)}
                    onToggleItem={toggleControlItem}
                  />
                ))}
              </div>
              <Field label="Bemærkninger">
                <textarea placeholder="Tilføj tekniske observationer eller afvigelser..." />
              </Field>
            </StepFrame>
          )}

          {currentStep === "closure" && (
            <StepFrame
              title="Afslutning af sag"
              lead="Marker sagens status og hvilke dokumenter der følger med. Ikke færdig kan ikke kombineres med færdig eller klar til faktura."
            >
              <div className="closure-grid" aria-label="Afslutning af sag">
                {closureFlags.map((flag) => (
                  <button
                    key={flag.id}
                    type="button"
                    className={`check-choice ${closure.includes(flag.id) ? "active" : ""}`}
                    onClick={() => toggleClosureFlag(flag.id)}
                  >
                    <span>{closure.includes(flag.id) && <Check size={16} strokeWidth={3} />}</span>
                    {flag.label}
                  </button>
                ))}
              </div>
            </StepFrame>
          )}

          {currentStep === "signature" && (
            <StepFrame
              title="Underskrift - Montør"
              lead="Kundens 4V05-skema afsluttes med dato og montørunderskrift. Dette trin handler kun om montørens underskrift."
              callout="Efter underskrift låses rapporten og kan sendes til kontoret."
            >
              <Field label="Dato">
                <input type="date" defaultValue="2026-05-15" />
              </Field>
              <Field label="Montør">
                <input defaultValue="Niels Petersen" autoComplete="name" />
              </Field>
              <button className="signature-pad" type="button">
                <PenLine size={24} />
                Tryk for montørunderskrift
              </button>
            </StepFrame>
          )}

          {currentStep === "done" && (
            <StepFrame
              title="Rapport sendt"
              lead="4V05 arbejdsrapporten er udfyldt, underskrevet af montør og klar til kontorets gennemgang."
            >
              <div className="done-panel">
                <div className="done-mark">
                  <Check size={26} strokeWidth={3} />
                </div>
                <h2>4V05 klar til kontoret</h2>
                <p>Kontoret kan nu gennemgå kontrolpunkter, bemærkninger og afslutningsstatus.</p>
              </div>
              <div className="summary-box">
                <SummaryRow label="Rapport" value="4V05-001" />
                <SummaryRow label="Anlægstype" value={selectedInstallationLabels.join(", ") || "Ikke valgt"} />
                <SummaryRow
                  label="Arbejdstype"
                  value={
                    selectedWorkKind?.requiresCustomText
                      ? customWorkKind || "Andet"
                      : selectedWorkKind?.label ?? "Ikke valgt"
                  }
                />
                <SummaryRow label="Afslutning" value={closure.map((flag) => closureFlags.find((item) => item.id === flag)?.label).join(", ")} />
                <SummaryRow label="Signering" value="Niels Petersen, montør" />
              </div>
            </StepFrame>
          )}
        </div>

        <footer className="bottom-bar">
          <div>
            <span>{stepText}</span>
            <strong>{currentStep === "done" ? "Færdig" : `Næste: ${nextLabels[currentStep]}`}</strong>
          </div>
          <button type="button" onClick={goNext}>
            {primaryLabel}
            {currentStep !== "done" && <ChevronRight size={18} />}
          </button>
        </footer>
      </section>

      <aside className="desktop-context" aria-label="Demo overblik">
        <div className="context-card">
          <ClipboardCheck size={24} />
          <h2>4V05 som source of truth</h2>
          <p>Flowet følger kundens arbejdsrapport i stedet for en generisk materialeliste.</p>
        </div>
        <div className="context-card">
          <Wrench size={24} />
          <h2>Relevante kontroller</h2>
          <p>Valgt anlægstype styrer hvilke kontrolpunkter montøren ser.</p>
        </div>
        <div className="context-card">
          <FileSignature size={24} />
          <h2>Montørunderskrift</h2>
          <p>Rapporten afsluttes med montørens underskrift, som i kundens PDF.</p>
        </div>
      </aside>
    </main>
  );
}

function StepFrame({
  title,
  lead,
  callout,
  children
}: {
  title: string;
  lead: string;
  callout?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <h1>{title}</h1>
      <p className="lead">{lead}</p>
      {callout && (
        <div className="callout">
          <span>{callout}</span>
        </div>
      )}
      <div className="form">{children}</div>
    </>
  );
}

function Field({
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

function ControlStageCard({
  stage,
  columns,
  expanded,
  values,
  onToggleStage,
  onToggleItem
}: {
  stage: ControlStage;
  columns: ActiveControlColumn[];
  expanded: boolean;
  values: Record<string, boolean>;
  onToggleStage: () => void;
  onToggleItem: (itemId: string) => void;
}) {
  const itemCount = columns.reduce((count, column) => count + (stage.items[column]?.length ?? 0), 0);
  const checkedCount = columns.reduce(
    (count, column) => count + (stage.items[column] ?? []).filter((item) => values[item.id]).length,
    0
  );

  return (
    <article className={`control-stage ${expanded ? "expanded" : ""}`}>
      <button className="control-stage-header" type="button" aria-expanded={expanded} onClick={onToggleStage}>
        <div>
          <h2>{stage.title}</h2>
          <span>
            {checkedCount} af {itemCount} markeret
          </span>
        </div>
        <ChevronDown size={20} strokeWidth={2.5} />
      </button>
      {expanded && (
        <div className="control-columns">
          {columns.map((column) => {
            const columnConfig = controlColumns.find((item) => item.id === column);
            const items = stage.items[column] ?? [];
            if (items.length === 0) return null;

            return (
              <section className="control-column" key={`${stage.id}-${column}`}>
                <h3>{columnConfig?.label}</h3>
                <div className="control-items">
                  {items.map((item) => (
                    <ControlItemRow
                      key={item.id}
                      item={item}
                      checked={values[item.id] ?? false}
                      onToggle={() => onToggleItem(item.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </article>
  );
}

function ControlItemRow({
  item,
  checked,
  onToggle
}: {
  item: ControlItem;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button className={`control-item ${checked ? "checked" : ""}`} type="button" onClick={onToggle}>
      <span>{checked && <Check size={16} strokeWidth={3} />}</span>
      <strong>{item.label}</strong>
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="summary-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
