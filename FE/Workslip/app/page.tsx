"use client";

import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
  UserCheck,
  Wrench,
  Plus
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  closureFlags,
  controlColumns,
  controlStages,
  getCategoryValidationErrors,
  getControlColumnsForInstallations,
  getControlStageValidationErrors,
  installationTypes,
  workKinds,
  type ActiveControlColumn,
  type ClosureFlag,
  type ControlItem,
  type ControlStage,
  type InstallationType,
  type WorkKind
} from "../lib/4v05-schema";
import {
  buildDraftFromCase,
  createBlankDraft,
  demoCases,
  getDraftProgress,
  getNextReportNumber,
  initialCaseControlValues,
  type WorkslipCase,
  type WorkslipCaseStatus,
  type WorkslipDraft
} from "../lib/demo-cases";

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
  closure: "Attestering",
  signature: "Send",
  done: "Færdig"
};

const initialControlValues = initialCaseControlValues;

export default function Home() {
  const [cases, setCases] = useState<WorkslipCase[]>(demoCases);
  const [draftsByCaseId, setDraftsByCaseId] = useState<Record<string, WorkslipDraft>>(() =>
    Object.fromEntries(demoCases.map((item) => [item.caseId, buildDraftFromCase(item)]))
  );
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<StepId>("report");
  const [selectedInstallations, setSelectedInstallations] = useState<InstallationType[]>([]);
  const [workKind, setWorkKind] = useState<WorkKind | null>(null);
  const [customWorkKind, setCustomWorkKind] = useState("");
  const [categoryErrors, setCategoryErrors] = useState<string[]>([]);
  const [controlValues, setControlValues] = useState<Record<string, boolean>>(initialControlValues);
  const [expandedControlStages, setExpandedControlStages] = useState<string[]>([]);
  const [selectedControlStages, setSelectedControlStages] = useState<string[]>([]);
  const [controlStepError, setControlStepError] = useState("");
  const [customerInfoExpanded, setCustomerInfoExpanded] = useState(false);
  const [closure, setClosure] = useState<ClosureFlag[]>([]);
  const [closureError, setClosureError] = useState("");
  const [showDescriptionError, setShowDescriptionError] = useState(false);
  const [description, setDescription] = useState("");
  const [showInlineConfirm, setShowInlineConfirm] = useState(false);
  const [customerName, setCustomerName] = useState("Aarhus VVS Aps");
  const [address, setAddress] = useState("Trøjborgvej 12, 8200 Aarhus N");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("28 92 91 73");
  const [date, setDate] = useState("2026-05-15");
  const [reportNumber, setReportNumber] = useState("1337");
  const [customerNotes, setCustomerNotes] = useState("Toilet udskiftet");
  const [expandedSummaryStages, setExpandedSummaryStages] = useState<string[]>([]);
  const signedInUser = {
    name: "Rasmus Bak",
    role: "Montør",
    organization: "Aarhus VVS ApS",
    identityProvider: "MitID Erhverv",
    assurance: "Godkendt med Face ID"
  };

  const selectedCase = cases.find((item) => item.caseId === selectedCaseId) ?? null;

  function createDraftFromCurrentForm(nextStep: StepId = currentStep): WorkslipDraft {
    return {
      currentStep: nextStep,
      customerName,
      address,
      contactPerson,
      phone,
      date,
      reportNumber,
      description,
      customerNotes,
      selectedInstallations: [...selectedInstallations],
      workKind,
      customWorkKind,
      controlValues: { ...controlValues },
      selectedControlStages: [...selectedControlStages],
      expandedControlStages: [...expandedControlStages],
      closure: [...closure]
    };
  }

  function applyDraft(draft: WorkslipDraft) {
    setCurrentStep(draft.currentStep);
    setCustomerName(draft.customerName);
    setAddress(draft.address);
    setContactPerson(draft.contactPerson);
    setPhone(draft.phone);
    setDate(draft.date);
    setReportNumber(draft.reportNumber);
    setDescription(draft.description);
    setCustomerNotes(draft.customerNotes);
    setSelectedInstallations([...draft.selectedInstallations]);
    setWorkKind(draft.workKind);
    setCustomWorkKind(draft.customWorkKind);
    setControlValues({ ...initialControlValues, ...draft.controlValues });
    setSelectedControlStages([...draft.selectedControlStages]);
    setExpandedControlStages([...draft.expandedControlStages]);
    setClosure([...draft.closure]);
    setCategoryErrors([]);
    setControlStepError("");
    setClosureError("");
    setShowDescriptionError(false);
    setShowInlineConfirm(false);
  }

  function persistCurrentDraft(nextStep: StepId = currentStep) {
    if (!selectedCaseId) return;

    const nextDraft = createDraftFromCurrentForm(nextStep);
    setDraftsByCaseId((current) => ({
      ...current,
      [selectedCaseId]: nextDraft
    }));
    setCases((current) =>
      current.map((item) =>
        item.caseId === selectedCaseId && item.status === "open"
          ? { ...item, status: "draft" }
          : item
      )
    );
  }

  function loadDraftIntoForm(caseId: string) {
    const workslipCase = cases.find((item) => item.caseId === caseId);
    if (!workslipCase) return;

    const draft = draftsByCaseId[caseId] ?? buildDraftFromCase(workslipCase);
    setSelectedCaseId(caseId);
    applyDraft(draft);
  }

  function createNewCase() {
    const reportNumber = getNextReportNumber(cases);
    const today = new Date().toISOString().slice(0, 10);
    const nextCaseNumber = `SAG-${1001 + cases.length}`;
    const newCase: WorkslipCase = {
      caseId: `case-new-${Date.now()}`,
      caseNumber: nextCaseNumber,
      customerName: "",
      address: "",
      contactPerson: "",
      phone: "",
      taskDescription: "",
      scheduledDate: today,
      priority: "normal",
      status: "draft",
      reportNumber
    };
    const draft = createBlankDraft({ reportNumber, scheduledDate: today });

    setCases((current) => [newCase, ...current]);
    setDraftsByCaseId((current) => ({ ...current, [newCase.caseId]: draft }));
    setSelectedCaseId(newCase.caseId);
    applyDraft(draft);
  }

  function returnToCaseList(nextStep: StepId = currentStep) {
    persistCurrentDraft(nextStep);
    setSelectedCaseId(null);
    setShowInlineConfirm(false);
  }

  const currentIndex = stepOrder.indexOf(currentStep);
  const stepCount = stepOrder.length - 1;
  const stepText = selectedCaseId === null ? "Sagsliste" : currentStep === "done" ? "Færdig" : `Trin ${currentIndex + 1} af ${stepCount}`;
  const progress = selectedCaseId === null ? 0 : currentStep === "done" ? 100 : Math.max(8, (currentIndex / stepCount) * 100);

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
    if (!selectedCaseId) return;

    if (currentStep === "report" && description.trim().length === 0) {
      setShowDescriptionError(true);
      return;
    }

    if (currentStep === "categories") {
      const errors = getCategoryValidationErrors({
        selectedInstallations,
        workKind,
        customWorkKind
      });

      setCategoryErrors(errors);
      if (errors.length > 0) {
        return;
      }
    }

    if (currentStep === "controls") {
      const errors = getControlStageValidationErrors({
        selectedStageIds: selectedControlStages,
        checkedItemIds: Object.entries(controlValues)
          .filter(([, checked]) => checked)
          .map(([itemId]) => itemId),
        activeColumns: activeControlColumnIds
      });

      setControlStepError(errors._controls ?? "");
      if (Object.keys(errors).length > 0) {
        return;
      }
    }

    if (currentStep === "closure" && closure.length === 0) {
      setClosureError("Vælg mindst én afslutningsstatus");
      return;
    }
    setClosureError("");

    if (currentStep === "signature") {
      setShowInlineConfirm(true);
      return;
    }

    if (currentStep === "done") {
      returnToCaseList("done");
      return;
    }

    const nextStep = stepOrder[Math.min(currentIndex + 1, stepOrder.length - 1)];
    persistCurrentDraft(nextStep);
    setCurrentStep(nextStep);
  }

  function goBack() {
    if (!selectedCaseId) return;

    if (currentStep === "report") {
      returnToCaseList("report");
      return;
    }

    const previousStep = stepOrder[Math.max(currentIndex - 1, 0)];
    persistCurrentDraft(previousStep);
    setCurrentStep(previousStep);
  }

  function toggleInstallation(id: InstallationType) {
    setSelectedInstallations((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      return [...current, id];
    });
    setCategoryErrors([]);
  }

  function toggleControlItem(itemId: string) {
    setControlValues((current) => ({ ...current, [itemId]: !current[itemId] }));
    setControlStepError("");
  }

  function toggleControlStage(stageId: string) {
    setSelectedControlStages((current) => (current.includes(stageId) ? current : [...current, stageId]));
    setExpandedControlStages((current) =>
      current.includes(stageId) ? current.filter((id) => id !== stageId) : [...current, stageId]
    );
  }

  function toggleClosureFlag(id: ClosureFlag) {
    setClosureError("");
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

  const controlStageSummary = useMemo(
    () =>
      visibleStages
        .map((stage) => {
          const columns = activeControlColumnIds.filter((col) => (stage.items[col]?.length ?? 0) > 0);
          const allItems = columns.flatMap((col) => stage.items[col] ?? []);
          const checkedItems = allItems.filter((item) => controlValues[item.id]);
          return { stage, columns, checkedItems, totalItems: allItems.length, checkedCount: checkedItems.length };
        })
        .filter((s) => s.checkedCount > 0),
    [visibleStages, activeControlColumnIds, controlValues]
  );

  const primaryLabel =
    currentStep === "signature" ? "Send" : currentStep === "done" ? "Til sagsliste" : "Fortsæt";

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
              disabled={selectedCaseId === null || currentStep === "done"}
            >
              <ArrowLeft size={21} strokeWidth={2.4} />
            </button>
            <div className="meta">
              <span>{stepText}</span>
            </div>
          </div>
          {selectedCase ? (
            <button className="doc-title doc-title-button" type="button" aria-label="Til sagsliste" onClick={() => returnToCaseList(currentStep)}>
              <span>{selectedCase.caseNumber} · Tilbage til liste</span>
              <span className="doc-title-shortcut">Sager</span>
            </button>
          ) : (
            <div className="doc-title">Dagens sager</div>
          )}
          <div className="progress" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
        </header>

        <div className="screen">
          {selectedCaseId === null && (
            <CaseListScreen
              cases={cases}
              draftsByCaseId={draftsByCaseId}
              onOpenCase={loadDraftIntoForm}
              onCreateCase={createNewCase}
            />
          )}

          {selectedCaseId !== null && currentStep === "report" && (
            <StepFrame
              title="4V05 arbejdsrapport"
            >
              <Field label="Kunde">
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} autoComplete="organization" />
              </Field>
              <Field label="Adresse">
                <input value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" />
              </Field>
              <div className="two-column">
                <Field label="Kontaktperson">
                  <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} autoComplete="name" />
                </Field>
                <Field label="Tlf.">
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" />
                </Field>
              </div>
              <div className="two-column">
                <Field label="Dato">
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </Field>
                <Field label="Rapportnummer">
                  <input value={reportNumber} onChange={(e) => setReportNumber(e.target.value)} inputMode="numeric" />
                </Field>
              </div>
              <Field
                label="Opgavebeskrivelse"
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
                    <textarea value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} placeholder="Skriv oplysninger til kunden eller tekniske observationer..." />
                  </Field>
                )}
              </section>
            </StepFrame>
          )}

          {selectedCaseId !== null && currentStep === "categories" && (
            <StepFrame
              title="Kategorier"
              lead="Vælg anlægstype og arbejdstype."
            >
              <section className="category-panel" aria-labelledby="installation-category">
                <div className="section-heading">
                  <h2 id="installation-category">Anlægstype</h2>
                  <p>Vælg en eller flere fra 4V05-skema.</p>
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
                      onClick={() => {
                        setWorkKind((current) => (current === kind.id ? null : kind.id));
                        setCategoryErrors([]);
                      }}
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
                  <Field label="Ret opgavetype">
                    <input
                      value={customWorkKind}
                      onChange={(event) => {
                        setCustomWorkKind(event.target.value);
                        setCategoryErrors([]);
                      }}
                      placeholder="Fx serviceeftersyn eller rådgivning"
                    />
                  </Field>
                )}
              </section>
            </StepFrame>
          )}

          {selectedCaseId !== null && currentStep === "controls" && (
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
                    selected={selectedControlStages.includes(stage.id)}
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

          {selectedCaseId !== null && currentStep === "closure" && (
            <StepFrame
              title="Afslutning af sag"
              lead="Marker sagens status. 'Ikke færdig' kan ikke kombineres med 'færdig' eller 'klar til faktura'."
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

          {selectedCaseId !== null && currentStep === "signature" && (
            <StepFrame
              title="Digital attestering"
              lead="Gennemgå rapporten og bekræft med den bruger, der er logget ind. Attesteringen gemmes med navn, rolle, tidspunkt og rapportens kontrolpunkter."
            >
              <div className="identity-card">
                <div className="identity-icon">
                  <ShieldCheck size={22} strokeWidth={2.7} />
                </div>
                <div className="identity-main">
                  <span>Logget ind med {signedInUser.identityProvider}</span>
                  <strong>{signedInUser.name}</strong>
                  <small>{signedInUser.role} · {signedInUser.organization}</small>
                </div>
              </div>

              <div className="summary-box sm">
                <SummaryRow label="Kunde" value={customerName} />
                <SummaryRow label="Adresse" value={address} />
                <div className="summary-row sm">
                  <span>Kontakt</span>
                  <strong>{contactPerson} · {phone}</strong>
                </div>
                <SummaryRow label="Dato" value={date} />
                <SummaryRow label="Rapport" value={reportNumber} />
                <SummaryRow label="Anlæg" value={selectedInstallationLabels.join(", ") || "Ikke valgt"} />
                <SummaryRow
                  label="Arbejdstype"
                  value={
                    selectedWorkKind?.requiresCustomText
                      ? customWorkKind || "Andet"
                      : selectedWorkKind?.label ?? "Ikke valgt"
                  }
                />
                {description && <SummaryRow label="Beskrivelse" value={description} />}
                {customerNotes && <SummaryRow label="Noter" value={customerNotes} />}
              </div>

              {controlStageSummary.length > 0 && (
                <div className="summary-box sm" style={{ marginTop: 10 }}>
                  {controlStageSummary.map(({ stage, columns, checkedItems, checkedCount, totalItems }) => {
                    const isExpanded = expandedSummaryStages.includes(stage.id);
                    return (
                      <div key={stage.id}>
                        <button
                          className="summary-stage-header"
                          type="button"
                          onClick={() =>
                            setExpandedSummaryStages((prev) =>
                              prev.includes(stage.id) ? prev.filter((id) => id !== stage.id) : [...prev, stage.id]
                            )
                          }
                        >
                          <span className="summary-stage-label">
                            <ChevronDown size={14} strokeWidth={2.5} className={`stage-chevron ${isExpanded ? "open" : ""}`} />
                            {stage.title}
                          </span>
                          <span className="summary-stage-count">{checkedCount}/{totalItems}</span>
                        </button>
                        {isExpanded && (
                          <div className="summary-stage-items">
                            {columns.map((col) => {
                              const columnLabel = controlColumns.find((c) => c.id === col)?.label;
                              const items = (stage.items[col] ?? []).filter((item) => checkedItems.some((ci) => ci.id === item.id));
                              if (items.length === 0) return null;
                              return (
                                <div key={col} className="summary-col-group">
                                  <span className="summary-col-label">{columnLabel}</span>
                                  {items.map((item) => (
                                    <div key={item.id} className="summary-item">
                                      <Check size={12} strokeWidth={3} />
                                      {item.label}
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {closure.length > 0 && (
                <div className="summary-box sm" style={{ marginTop: 10 }}>
                  <SummaryRow
                    label="Afslutning"
                    value={closure.map((flag) => closureFlags.find((item) => item.id === flag)?.label).join(", ")}
                  />
                </div>
              )}

              <div className="attestation-panel">
                <div className="attestation-header">
                  <UserCheck size={20} strokeWidth={2.7} />
                  <div>
                    <strong>Montørens bekræftelse</strong>
                    <span>Gemmes som digital attestering i audit trail.</span>
                  </div>
                </div>
                <p>
                  Jeg bekræfter, at arbejdet er udført, og at de markerede kontrolpunkter er kontrolleret efter virksomhedens KLS.
                </p>
                <div className="attestation-facts">
                  <div>
                    <span>Bruger</span>
                    <strong>{signedInUser.name}</strong>
                  </div>
                  <div>
                    <span>Rolle</span>
                    <strong>{signedInUser.role}</strong>
                  </div>
                  <div>
                    <span>Dato</span>
                    <strong>{date}</strong>
                  </div>
                  <div>
                    <span>Metode</span>
                    <strong>MitID</strong>
                  </div>
                </div>
                <div className="device-proof">
                  <Smartphone size={17} strokeWidth={2.5} />
                  <span>{signedInUser.assurance}</span>
                </div>
              </div>

            </StepFrame>
          )}

          {selectedCaseId !== null && currentStep === "done" && (
            <StepFrame
              title="Rapport sendt"
              lead="4V05 arbejdsrapporten er udfyldt, digitalt attesteret af montør og klar til kontorets gennemgang."
            >
              <div className="done-panel">
                <div className="done-mark">
                  <Check size={26} strokeWidth={3} />
                </div>
                <h2>4V05 klar til kontoret</h2>
                <p>Kontoret kan nu gennemgå kontrolpunkter, bemærkninger og afslutningsstatus.</p>
              </div>

              <div className="summary-box sm" style={{ marginTop: 14 }}>
                <SummaryRow label="Kunde" value={customerName} />
                <SummaryRow label="Adresse" value={address} />
                <div className="summary-row sm">
                  <span>Kontakt</span>
                  <strong>{contactPerson} · {phone}</strong>
                </div>
                <SummaryRow label="Dato" value={date} />
                <SummaryRow label="Rapport" value={reportNumber} />
                <SummaryRow label="Anlæg" value={selectedInstallationLabels.join(", ") || "Ikke valgt"} />
                <SummaryRow
                  label="Arbejdstype"
                  value={
                    selectedWorkKind?.requiresCustomText
                      ? customWorkKind || "Andet"
                      : selectedWorkKind?.label ?? "Ikke valgt"
                  }
                />
                {description && <SummaryRow label="Beskrivelse" value={description} />}
                {customerNotes && <SummaryRow label="Noter" value={customerNotes} />}
              </div>

              {controlStageSummary.length > 0 && (
                <div className="summary-box sm" style={{ marginTop: 10 }}>
                  {controlStageSummary.map(({ stage, columns, checkedItems, checkedCount, totalItems }) => {
                    const isExpanded = expandedSummaryStages.includes(stage.id);
                    return (
                      <div key={stage.id}>
                        <button
                          className="summary-stage-header"
                          type="button"
                          onClick={() =>
                            setExpandedSummaryStages((prev) =>
                              prev.includes(stage.id) ? prev.filter((id) => id !== stage.id) : [...prev, stage.id]
                            )
                          }
                        >
                          <span className="summary-stage-label">
                            <ChevronDown size={14} strokeWidth={2.5} className={`stage-chevron ${isExpanded ? "open" : ""}`} />
                            {stage.title}
                          </span>
                          <span className="summary-stage-count">{checkedCount}/{totalItems}</span>
                        </button>
                        {isExpanded && (
                          <div className="summary-stage-items">
                            {columns.map((col) => {
                              const columnLabel = controlColumns.find((c) => c.id === col)?.label;
                              const items = (stage.items[col] ?? []).filter((item) => checkedItems.some((ci) => ci.id === item.id));
                              if (items.length === 0) return null;
                              return (
                                <div key={col} className="summary-col-group">
                                  <span className="summary-col-label">{columnLabel}</span>
                                  {items.map((item) => (
                                    <div key={item.id} className="summary-item">
                                      <Check size={12} strokeWidth={3} />
                                      {item.label}
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {closure.length > 0 && (
                <div className="summary-box sm" style={{ marginTop: 10 }}>
                  <SummaryRow
                    label="Afslutning"
                    value={closure.map((flag) => closureFlags.find((item) => item.id === flag)?.label).join(", ")}
                  />
                  <SummaryRow label="Attestering" value={`${signedInUser.name}, ${signedInUser.role} via ${signedInUser.identityProvider}`} />
                </div>
              )}
            </StepFrame>
          )}
        </div>

        <footer className="bottom-bar">
          {selectedCaseId === null ? (
            <div className="case-list-footer">
              <div>
                <span>Sagskø</span>
                <strong>{cases.length} sager i demoen</strong>
              </div>
              <button type="button" onClick={createNewCase}>
                <Plus size={18} />
                Opret sag
              </button>
            </div>
          ) : (
            <>
          {currentStep === "categories" && categoryErrors.length > 0 && (
            <div className="bottom-error">
              {categoryErrors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          )}
          {currentStep === "controls" && controlStepError && <p className="bottom-error">{controlStepError}</p>}
          {currentStep === "closure" && closureError && <p className="bottom-error">{closureError}</p>}
          {currentStep === "signature" && showInlineConfirm ? (
            <div className="inline-confirm">
              <span>Bekræft med digital attestering?</span>
              <div className="inline-confirm-actions">
                <button className="inline-confirm-btn secondary" onClick={() => setShowInlineConfirm(false)}>
                  Annuller
                </button>
                <button
                  className="inline-confirm-btn primary"
                  onClick={() => {
                    setShowInlineConfirm(false);
                    if (selectedCaseId) {
                      setCases((current) =>
                        current.map((item) =>
                          item.caseId === selectedCaseId ? { ...item, status: "submitted" } : item
                        )
                      );
                      setDraftsByCaseId((current) => ({
                        ...current,
                        [selectedCaseId]: createDraftFromCurrentForm("done")
                      }));
                    }
                    setCurrentStep("done");
                  }}
                >
                  Bekræft og send
                </button>
              </div>
            </div>
          ) : (
            <div className="bottom-actions">
              <div>
                <span>{stepText}</span>
                <strong>{currentStep === "done" ? "Færdig" : `Næste: ${nextLabels[currentStep]}`}</strong>
              </div>
              <button type="button" onClick={goNext}>
                {primaryLabel}
                {currentStep !== "done" && <ChevronRight size={18} />}
              </button>
            </div>
          )}
            </>
          )}
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
          <LockKeyhole size={24} />
          <h2>Digital attestering</h2>
          <p>Montøren bekræfter rapporten med login, rolle, tidspunkt og audit trail i stedet for tegnet signatur.</p>
        </div>
      </aside>
    </main>
  );
}

function CaseListScreen({
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

function CaseCard({
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

function CaseStatusPill({ status }: { status: WorkslipCaseStatus }) {
  const label: Record<WorkslipCaseStatus, string> = {
    open: "Åben",
    draft: "Kladde",
    submitted: "Indsendt"
  };

  return <span className={`case-status ${status}`}>{label[status]}</span>;
}

function formatCaseDate(value: string) {
  return new Date(value).toLocaleDateString("da-DK", {
    day: "2-digit",
    month: "short"
  });
}

function StepFrame({
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
  selected,
  values,
  onToggleStage,
  onToggleItem
}: {
  stage: ControlStage;
  columns: ActiveControlColumn[];
  expanded: boolean;
  selected: boolean;
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
            {selected ? `${checkedCount} af ${itemCount} markeret` : `${itemCount} underkategorier`}
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
