import {
  controlStages,
  type ClosureFlag,
  type InstallationType,
  type WorkKind
} from "./4v05-schema.ts";

export type WorkslipCaseStatus = "open" | "draft" | "submitted";
export type WorkslipCasePriority = "normal" | "urgent";
export type WorkslipFlowStep = "report" | "categories" | "controls" | "closure" | "signature" | "done";

export type WorkslipDraft = {
  currentStep: WorkslipFlowStep;
  customerName: string;
  address: string;
  contactPerson: string;
  phone: string;
  date: string;
  reportNumber: string;
  description: string;
  customerNotes: string;
  selectedInstallations: InstallationType[];
  workKind: WorkKind | null;
  customWorkKind: string;
  controlValues: Record<string, boolean>;
  selectedControlStages: string[];
  expandedControlStages: string[];
  closure: ClosureFlag[];
};

export type WorkslipCase = {
  caseId: string;
  caseNumber: string;
  customerName: string;
  address: string;
  contactPerson: string;
  phone: string;
  taskDescription: string;
  scheduledDate: string;
  priority: WorkslipCasePriority;
  status: WorkslipCaseStatus;
  reportNumber: string;
  initialDraft?: Partial<WorkslipDraft>;
};

export type DraftProgress = {
  completed: number;
  total: number;
  label: string;
};

export const initialCaseControlValues: Record<string, boolean> = Object.fromEntries(
  controlStages.flatMap((stage) =>
    Object.values(stage.items)
      .flat()
      .filter(Boolean)
      .map((item) => [item.id, false])
  )
);

export const demoCases: WorkslipCase[] = [
  {
    caseId: "case-1001",
    caseNumber: "SAG-1001",
    customerName: "Boligforeningen Ringgården",
    address: "Ringgade 45, 2. tv., 8000 Aarhus C",
    contactPerson: "Peter Mortensen",
    phone: "22 14 88 32",
    taskDescription: "Vand under køkkenvask. Kontroller vandlås og varmtvandstilslutning.",
    scheduledDate: "2026-05-17",
    priority: "urgent",
    status: "open",
    reportNumber: "1338",
    initialDraft: {
      selectedInstallations: ["vand", "aflob"],
      workKind: "reparation",
      customerNotes: "Nøgleboks ved bagtrappe. Faktura sendes til boligforening."
    }
  },
  {
    caseId: "case-1002",
    caseNumber: "SAG-1002",
    customerName: "Aarhus Ejendomme ApS",
    address: "Trøjborgvej 12, 8200 Aarhus N",
    contactPerson: "Mette Jensen",
    phone: "26 75 09 81",
    taskDescription: "Årligt serviceeftersyn på varmeanlæg og kontrol af cirkulationspumpe.",
    scheduledDate: "2026-05-17",
    priority: "normal",
    status: "open",
    reportNumber: "1339",
    initialDraft: {
      selectedInstallations: ["varme"],
      workKind: "serviceAndet",
      customWorkKind: "Serviceeftersyn"
    }
  },
  {
    caseId: "case-1003",
    caseNumber: "SAG-1003",
    customerName: "Midtjysk Varmeservice",
    address: "Varmevej 3, 7400 Herning",
    contactPerson: "Lone Kristensen",
    phone: "29 84 11 56",
    taskDescription: "Ny vandinstallation til bryggers og trykprøvning før aflevering.",
    scheduledDate: "2026-05-18",
    priority: "normal",
    status: "open",
    reportNumber: "1340",
    initialDraft: {
      selectedInstallations: ["vand"],
      workKind: "nyInstallation"
    }
  }
];

export function createBlankDraft({
  reportNumber,
  scheduledDate
}: {
  reportNumber: string;
  scheduledDate: string;
}): WorkslipDraft {
  return {
    currentStep: "report",
    customerName: "",
    address: "",
    contactPerson: "",
    phone: "",
    date: scheduledDate,
    reportNumber,
    description: "",
    customerNotes: "",
    selectedInstallations: [],
    workKind: null,
    customWorkKind: "",
    controlValues: { ...initialCaseControlValues },
    selectedControlStages: [],
    expandedControlStages: [],
    closure: []
  };
}

export function buildDraftFromCase(workslipCase: WorkslipCase): WorkslipDraft {
  return {
    ...createBlankDraft({
      reportNumber: workslipCase.reportNumber,
      scheduledDate: workslipCase.scheduledDate
    }),
    customerName: workslipCase.customerName,
    address: workslipCase.address,
    contactPerson: workslipCase.contactPerson,
    phone: workslipCase.phone,
    description: workslipCase.taskDescription,
    ...workslipCase.initialDraft,
    controlValues: {
      ...initialCaseControlValues,
      ...workslipCase.initialDraft?.controlValues
    }
  };
}

export function getNextReportNumber(cases: WorkslipCase[]): string {
  const highest = cases.reduce((max, item) => {
    const value = Number.parseInt(item.reportNumber, 10);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);

  return String(highest + 1);
}

export function getDraftProgress(draft: WorkslipDraft): DraftProgress {
  const completedSections = [
    draft.description.trim().length > 0,
    draft.selectedInstallations.length > 0 && draft.workKind !== null && (draft.workKind !== "serviceAndet" || draft.customWorkKind.trim().length > 0),
    Object.values(draft.controlValues).some(Boolean),
    draft.closure.length > 0
  ].filter(Boolean).length;

  return {
    completed: completedSections,
    total: 4,
    label: `${completedSections}/4`
  };
}
