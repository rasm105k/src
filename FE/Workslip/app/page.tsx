"use client";

import {
  ArrowLeft,
  Camera,
  Check,
  ChevronRight,
  FileSignature,
  ListPlus,
  Mic,
  Plus,
  Wrench
} from "lucide-react";
import { useMemo, useState } from "react";

type WorkType = "Service" | "Reparation" | "Installation";
type MaterialMode = "used" | "none";
type ControlResult = "ok" | "deviation";

type StepId =
  | "type"
  | "case"
  | "time"
  | "work"
  | "materials"
  | "control"
  | "signature"
  | "done";

type MaterialLine = {
  name: string;
  quantity: string;
  unit: string;
  itemNo: string;
};

const FLOW_BY_TYPE: Record<WorkType, StepId[]> = {
  Service: ["type", "case", "time", "work", "signature", "done"],
  Reparation: ["type", "case", "time", "work", "materials", "control", "signature", "done"],
  Installation: ["type", "case", "time", "work", "materials", "control", "signature", "done"]
};

const STEP_TITLES: Record<StepId, string> = {
  type: "Ny arbejdsseddel",
  case: "Sag",
  time: "Tid",
  work: "Arbejde",
  materials: "Materialer og foto",
  control: "Slutkontrol",
  signature: "Sikker signering",
  done: "Sendt til kontoret"
};

const NEXT_LABELS: Record<StepId, string> = {
  type: "Sag",
  case: "Tid",
  time: "Arbejde",
  work: "Materialer",
  materials: "Slutkontrol",
  control: "Signering",
  signature: "Send",
  done: "Færdig"
};

const defaultMaterials: MaterialLine[] = [
  { name: 'Bundventil 1 1/4"', quantity: "1", unit: "stk.", itemNo: "740112" },
  { name: "Pakningssæt", quantity: "2", unit: "stk.", itemNo: "183020" }
];

export default function Home() {
  const [workType, setWorkType] = useState<WorkType>("Reparation");
  const [currentStep, setCurrentStep] = useState<StepId>("type");
  const [description, setDescription] = useState("");
  const [showDescriptionError, setShowDescriptionError] = useState(false);
  const [materialMode, setMaterialMode] = useState<MaterialMode>("used");
  const [controlResult, setControlResult] = useState<ControlResult>("ok");
  const [materials] = useState<MaterialLine[]>(defaultMaterials);

  const flow = useMemo(() => FLOW_BY_TYPE[workType], [workType]);
  const currentIndex = flow.indexOf(currentStep);
  const stepCount = flow.length - 1;
  const progress = currentStep === "done" ? 100 : Math.max(8, (Math.max(currentIndex, 0) / stepCount) * 100);
  const stepText = currentStep === "done" ? "Færdig" : `Trin ${currentIndex + 1} af ${stepCount}`;

  function goToStep(step: StepId) {
    setCurrentStep(step);
  }

  function goNext() {
    if (currentStep === "work" && description.trim().length === 0) {
      setShowDescriptionError(true);
      return;
    }

    if (currentStep === "done") {
      setDescription("");
      setShowDescriptionError(false);
      setWorkType("Reparation");
      setMaterialMode("used");
      setControlResult("ok");
      goToStep("type");
      return;
    }

    const next = flow[Math.min(currentIndex + 1, flow.length - 1)];
    goToStep(next);
  }

  function goBack() {
    const previous = flow[Math.max(currentIndex - 1, 0)];
    goToStep(previous);
  }

  function handleWorkTypeChange(nextType: WorkType) {
    setWorkType(nextType);
    if (!FLOW_BY_TYPE[nextType].includes(currentStep)) {
      setCurrentStep("type");
    }
  }

  const primaryLabel =
    currentStep === "signature" ? "Start signering" : currentStep === "done" ? "Ny seddel" : "Fortsæt";

  return (
    <main className="app-shell">
      <section className="phone" aria-label="Workslip arbejdsseddel demo">
        <header className="app-header">
          <div className="topline">
            <button
              className="back-button"
              type="button"
              aria-label="Gå tilbage"
              onClick={goBack}
              disabled={currentStep === "type" || currentStep === "done"}
            >
              <ArrowLeft size={21} strokeWidth={2.4} />
            </button>
            <div className="meta">
              <span>{stepText}</span>
              <strong>{workType}</strong>
            </div>
          </div>
          <div className="progress" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
        </header>

        <div className="screen">
          {currentStep === "type" && (
            <StepFrame
              title="Ny arbejdsseddel"
              lead="Vælg typen af arbejde. Appen viser kun de felter, der er relevante for opgaven."
              callout="Standard demoen er en reparation med materialer, foto, slutkontrol og signering."
            >
              <div className="choice-list" role="radiogroup" aria-label="Arbejdstype">
                <Choice
                  active={workType === "Service"}
                  title="Service"
                  note="Kort besøg med tid, beskrivelse og signering."
                  onClick={() => handleWorkTypeChange("Service")}
                />
                <Choice
                  active={workType === "Reparation"}
                  title="Reparation"
                  note="Standard demo: tid, arbejde, materialer, foto, slutkontrol og signering."
                  onClick={() => handleWorkTypeChange("Reparation")}
                />
                <Choice
                  active={workType === "Installation"}
                  title="Installation"
                  note="Mere dokumentation: kørsel, billeder og tydelig Q-kontrol."
                  onClick={() => handleWorkTypeChange("Installation")}
                />
              </div>
            </StepFrame>
          )}

          {currentStep === "case" && (
            <StepFrame
              title="Sag"
              lead="Vælg kunde og sag. Montøren kan oprette midlertidige oplysninger, hvis kontoret ikke har lagt sagen ind endnu."
            >
              <Field label="Kunde">
                <input defaultValue="Aarhus Ejendomme ApS" autoComplete="off" />
              </Field>
              <Field label="Sagsnummer / job">
                <input defaultValue="REP-1048" autoComplete="off" />
              </Field>
              <Field label="Arbejdsadresse">
                <input defaultValue="Trøjborgvej 12, 8200 Aarhus N" autoComplete="street-address" />
              </Field>
              <Field label="Dato">
                <input type="date" defaultValue="2026-05-14" />
              </Field>
            </StepFrame>
          )}

          {currentStep === "time" && (
            <StepFrame
              title="Tid"
              lead="Registrer arbejdstiden. Appen beregner timerne og stopper kun åbenlyse fejl."
              callout="Beregnet arbejdstid: 3 timer og 0 minutter"
            >
              <div className="two-column">
                <Field label="Start">
                  <input type="time" defaultValue="07:30" />
                </Field>
                <Field label="Slut">
                  <input type="time" defaultValue="10:45" />
                </Field>
              </div>
              <Field label="Pause">
                <input inputMode="numeric" defaultValue="15 min" />
              </Field>
            </StepFrame>
          )}

          {currentStep === "work" && (
            <StepFrame
              title="Arbejde"
              lead="Beskriv det udførte arbejde, så kontoret kan forstå opgaven uden at ringe tilbage."
            >
              <Field
                label="Beskrivelse af udført arbejde"
                hint="Skriv eller dikter. Eksempel: “Udskiftede defekt bundventil og testede for lækage.”"
                error={showDescriptionError ? "Skriv hvad du har repareret, før du går videre." : undefined}
              >
                <div className="textarea-wrap">
                  <textarea
                    value={description}
                    onChange={(event) => {
                      setDescription(event.target.value);
                      if (event.target.value.trim().length > 0) setShowDescriptionError(false);
                    }}
                    placeholder="Tryk for at skrive eller diktere..."
                  />
                  <button className="dictate-button" type="button" aria-label="Dikter beskrivelse">
                    <Mic size={18} />
                    Dikter
                  </button>
                </div>
              </Field>
            </StepFrame>
          )}

          {currentStep === "materials" && (
            <StepFrame
              title="Materialer og foto"
              lead="Tilføj alle materialer der blev brugt på opgaven. Hver linje kan rettes, hvis noget er forkert."
            >
              <div className="choice-list compact" role="radiogroup" aria-label="Materialevalg">
                <Choice
                  active={materialMode === "used"}
                  title="Materialer brugt"
                  note={`${materials.length} linjer tilføjet. Kontoret kan bruge dem til fakturering.`}
                  onClick={() => setMaterialMode("used")}
                />
                <Choice
                  active={materialMode === "none"}
                  title="Ingen materialer"
                  note="Bruges kun hvis arbejdet ikke krævede varer."
                  onClick={() => setMaterialMode("none")}
                />
              </div>

              {materialMode === "used" && (
                <>
                  <div className="material-list" aria-label="Materialelinjer">
                    {materials.map((material) => (
                      <button className="material-row" type="button" key={material.itemNo}>
                        <div>
                          <strong>{material.name}</strong>
                          <span>
                            {material.quantity} {material.unit} · Varenr. {material.itemNo}
                          </span>
                        </div>
                        <span className="edit-link">Ret</span>
                      </button>
                    ))}
                    <div className="material-total">
                      {materials.length} materialelinjer er registreret. Tryk på en linje for at rette den.
                    </div>
                  </div>

                  <Field label="Ny materialelinje" hint="Brug dette felt til ekstra materialer, hvis der blev brugt mere.">
                    <input placeholder="Søg eller skriv materiale" />
                  </Field>

                  <button className="secondary-action" type="button">
                    <Plus size={18} />
                    Tilføj materiale
                  </button>
                </>
              )}

              <button className="secondary-action" type="button">
                <Camera size={18} />
                Tilføj billede hvis relevant
              </button>
            </StepFrame>
          )}

          {currentStep === "control" && (
            <StepFrame title="Slutkontrol" lead="Kontroller arbejdet, før sedlen kan sendes til sikker signering.">
              <div className="choice-list" role="radiogroup" aria-label="Slutkontrol resultat">
                <Choice
                  active={controlResult === "ok"}
                  title="OK - ingen afvigelse"
                  note="Arbejdet er kontrolleret og klar til signering."
                  onClick={() => setControlResult("ok")}
                />
                <Choice
                  active={controlResult === "deviation"}
                  title="Afvigelse registreret"
                  note="Kræver note og korrigerende handling."
                  onClick={() => setControlResult("deviation")}
                />
              </div>
              <Field label="Kontroltype">
                <select defaultValue="Visuel kontrol og tæthedstjek">
                  <option>Visuel kontrol og tæthedstjek</option>
                  <option>Trykprøvning</option>
                  <option>Funktionsafprøvning</option>
                </select>
              </Field>
              <Field label="Slutkontrol udført af">
                <input defaultValue="Rasmus, montør" />
              </Field>
            </StepFrame>
          )}

          {currentStep === "signature" && (
            <StepFrame
              title="Sikker signering"
              lead="Demoen simulerer en leverandørneutral sikker signering uden at binde produktet til MitID, Adobe eller andre leverandører."
              callout="Når signeringen er gennemført, låses arbejdssedlen og sendes til kontoret."
            >
              <Field label="Underskriverens navn">
                <input defaultValue="Mette Jensen" />
              </Field>
              <Field label="Rolle">
                <select defaultValue="Kunde">
                  <option>Kunde</option>
                  <option>Slutbruger</option>
                  <option>Intern ansvarlig</option>
                </select>
              </Field>
            </StepFrame>
          )}

          {currentStep === "done" && (
            <StepFrame
              title="Sendt til kontoret"
              lead="Arbejdssedlen er signeret, låst og klar til kontorets gennemgang."
            >
              <div className="done-panel">
                <div className="done-mark">
                  <Check size={26} strokeWidth={3} />
                </div>
                <h2>Arbejdsseddel sendt</h2>
                <p>Kontoret kan nu gennemgå sedlen, eksportere PDF og gøre den klar til fakturering.</p>
              </div>
              <div className="summary-box">
                <SummaryRow label="Type" value={workType} />
                <SummaryRow label="Sag" value="REP-1048" />
                <SummaryRow label="Tid" value="3 timer" />
                <SummaryRow label="Materialer" value={materialMode === "used" ? `${materials.length} linjer` : "Ingen"} />
                <SummaryRow label="Slutkontrol" value={controlResult === "ok" ? "OK - ingen afvigelse" : "Afvigelse"} />
                <SummaryRow label="Signering" value="Mette Jensen, kunde" />
              </div>
            </StepFrame>
          )}
        </div>

        <footer className="bottom-bar">
          <div>
            <span>{stepText}</span>
            <strong>{currentStep === "done" ? "Færdig" : `Næste: ${NEXT_LABELS[currentStep]}`}</strong>
          </div>
          <button type="button" onClick={goNext}>
            {primaryLabel}
            {currentStep !== "done" && <ChevronRight size={18} />}
          </button>
        </footer>
      </section>

      <aside className="desktop-context" aria-label="Demo overblik">
        <div className="context-card">
          <Wrench size={24} />
          <h2>Workslip demo</h2>
          <p>
            Mobil-first PWA til digitale arbejdssedler. Demoen viser en VVS-reparation fra oprettelse til
            signering.
          </p>
        </div>
        <div className="context-card">
          <ListPlus size={24} />
          <h2>Formprincip</h2>
          <p>Én logisk opgave ad gangen, store felter og kun relevante trin for den valgte arbejdstype.</p>
        </div>
        <div className="context-card">
          <FileSignature size={24} />
          <h2>Compliance</h2>
          <p>Slutkontrol og sikker signering er separate trin, så sedlen bliver klar til kontoret.</p>
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

function Choice({
  active,
  title,
  note,
  onClick
}: {
  active: boolean;
  title: string;
  note: string;
  onClick: () => void;
}) {
  return (
    <button className={`choice ${active ? "active" : ""}`} type="button" onClick={onClick}>
      <div>
        <strong>{title}</strong>
        <span>{note}</span>
      </div>
      <i aria-hidden="true" />
    </button>
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="summary-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
