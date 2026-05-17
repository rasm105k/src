import type { InstallationType, WorkKind, ClosureFlag, CheckedItem } from "./shared/domain-types";
export type { InstallationType, WorkKind, ClosureFlag, CheckedItem as ControlItem } from "./shared/domain-types";

export type ControlColumn = "gasVarme" | "vand" | "aflob" | "bemaerkninger";

export type ActiveControlColumn = Exclude<ControlColumn, "bemaerkninger">;

export type ControlState = "checked";

export const controlStates: ControlState[] = ["checked"];

export type ControlStage = {
  id: string;
  title: string;
  items: Partial<Record<ActiveControlColumn, CheckedItem[]>>;
};

export const installationTypes: Array<{
  id: InstallationType;
  label: string;
  shortLabel: string;
}> = [
  {
    id: "gas",
    label: "Gasinstallation",
    shortLabel: "Gas"
  },
  {
    id: "vand",
    label: "Vandinstallation",
    shortLabel: "Vand"
  },
  {
    id: "aflob",
    label: "Afløbsinstallation",
    shortLabel: "Afløb"
  },
  {
    id: "varme",
    label: "Varmeinstallation",
    shortLabel: "Varme"
  }
];

export const controlColumns: Array<{
  id: ActiveControlColumn;
  label: string;
}> = [
  { id: "gasVarme", label: "Gas / varme" },
  { id: "vand", label: "Vand" },
  { id: "aflob", label: "Afløb" }
];

export const installationToControlColumns: Record<InstallationType, ActiveControlColumn[]> = {
  gas: ["gasVarme"],
  vand: ["vand"],
  aflob: ["aflob"],
  varme: ["gasVarme"]
};

export function getControlColumnsForInstallations(
  selectedInstallations: InstallationType[]
): ActiveControlColumn[] {
  const selectedColumns = new Set(
    selectedInstallations.flatMap((installation) => installationToControlColumns[installation])
  );

  return controlColumns
    .map((column) => column.id)
    .filter((column) => selectedColumns.has(column));
}

export function getControlStageValidationErrors({
  checkedItemIds,
  activeColumns
}: {
  checkedItemIds: string[];
  activeColumns: ActiveControlColumn[];
}): Record<string, string> {
  const checkedItems = new Set(checkedItemIds);

  const missingColumns: string[] = [];
  for (const column of activeColumns) {
    const columnItemIds = controlStages.flatMap((stage) =>
      (stage.items[column] ?? []).map((item) => item.id)
    );
    const hasCheckedItem = columnItemIds.some((itemId) => checkedItems.has(itemId));
    if (!hasCheckedItem) {
      const label = controlColumns.find((c) => c.id === column)?.label ?? column;
      missingColumns.push(label.toLowerCase());
    }
  }

  if (missingColumns.length === 0) return {};

  const missing =
    missingColumns.length === 1
      ? missingColumns[0]
      : missingColumns.slice(0, -1).join(", ") + " og " + missingColumns[missingColumns.length - 1];

  return { _controls: `Vælg mindst ét kontrolpunkt for ${missing}` };
}

export function getCategoryValidationErrors({
  selectedInstallations,
  workKind,
  customWorkKind
}: {
  selectedInstallations: InstallationType[];
  workKind: WorkKind | null;
  customWorkKind: string;
}): string[] {
  const errors: string[] = [];

  if (selectedInstallations.length === 0) {
    errors.push("Vælg mindst én anlægstype.");
  }

  if (!workKind) {
    errors.push("Vælg en arbejdstype.");
  }

  const selectedWorkKind = workKinds.find((kind) => kind.id === workKind);
  if (selectedWorkKind?.requiresCustomText && customWorkKind.trim().length === 0) {
    errors.push("Skriv opgavetype i feltet.");
  }

  return errors;
}

export const workKinds: Array<{
  id: WorkKind;
  label: string;
  shortLabel: string;
  helper: string;
  requiresCustomText: boolean;
}> = [
  {
    id: "nyInstallation",
    label: "Ny installation",
    shortLabel: "Ny",
    helper: "Nyt anlæg eller ny del af installationen.",
    requiresCustomText: false
  },
  {
    id: "aendring",
    label: "Ændring af installation",
    shortLabel: "Ændring",
    helper: "Ændring eller udvidelse af eksisterende installation.",
    requiresCustomText: false
  },
  {
    id: "reparation",
    label: "Reparationsarbejde",
    shortLabel: "Reparation",
    helper: "Fejlretning, udskiftning eller mindre reparation.",
    requiresCustomText: false
  },
  {
    id: "serviceAndet",
    label: "Andet",
    shortLabel: "Andet",
    helper: "",
    requiresCustomText: true
  }
];

export const controlStages: ControlStage[] = [
  {
    id: "forundersoegelse",
    title: "Forundersøgelse",
    items: {
      gasVarme: [{ id: "gas-ansoegning", label: "Ansøgning på gas" }],
      vand: [
        { id: "vand-ansoegning", label: "Ansøgning på vand" },
        { id: "vandkvalitet", label: "Vandkvalitet" }
      ],
      aflob: [
        { id: "aflob-ansoegning", label: "Ansøgning på afløb" },
        { id: "aflob-fald-ledninger-forundersoegelse", label: "Fald på ledninger" },
        { id: "aflob-udluftninger-over-tag", label: "Udluftninger over tag" },
        { id: "aflob-vakuumventiler", label: "Vakuumventiler" }
      ]
    }
  },
  {
    id: "modtagekontrol",
    title: "Modtagekontrol",
    items: {
      gasVarme: [
        { id: "gas-roer-fittings", label: "Rør og fittings" },
        { id: "gas-armaturer", label: "Armaturer" },
        { id: "gas-kedel-vvb", label: "Kedel / VVB" },
        { id: "gas-saerlige-komponenter", label: "Særlige komponenter" }
      ],
      vand: [
        { id: "vand-roer-fittings", label: "Rør og fittings" },
        { id: "vand-armaturer", label: "Armaturer" },
        { id: "vand-vvb-veksler", label: "VVB / veksler" },
        { id: "vand-saerlige-komponenter", label: "Særlige komponenter" }
      ],
      aflob: [
        { id: "aflob-roer-fittings", label: "Rør og fittings" },
        { id: "aflob-installationsgenstande-modtage", label: "Installationsgenstande" },
        { id: "aflob-saerlige-komponenter", label: "Særlige komponenter" }
      ]
    }
  },
  {
    id: "udfoerelseskontrol",
    title: "Udførelseskontrol",
    items: {
      gasVarme: [
        { id: "gas-stikledning-indfoering", label: "Stikledning og indføring" },
        { id: "gas-roerophaeng", label: "Rørophæng" },
        { id: "gas-tilslutning-varmtvand", label: "Tilslutning til varmtvandsforsyning" }
      ],
      vand: [
        { id: "vand-stikledning-indfoering", label: "Stikledning og indføring" },
        { id: "vand-fordeler", label: "Fordeler omløber fastsp." },
        { id: "vand-koblingsdaaser", label: "Samling af koblingsdåser" },
        { id: "vand-tilslutning-varmtvand", label: "Tilslutning til varmtvandsforsyning" },
        { id: "vand-fittings-samlet", label: "Fittings presset, samlet, loddet." },
        { id: "vand-roer-vater-lod", label: "Rør i vater og lod" }
      ],
      aflob: [
        { id: "aflob-installationsgenstande-udfoerelse", label: "Installationsgenstande" },
        { id: "aflob-fald-ledninger-udfoerelse", label: "Fald på ledninger" }
      ]
    }
  },
  {
    id: "slutkontrol",
    title: "Slutkontrol",
    items: {
      gasVarme: [
        { id: "gas-taethed", label: "Tæthedsprøvning" },
        { id: "gas-funktion", label: "Funktionsafprøvning" },
        { id: "gas-sikkerhedsarmaturer", label: "Sikkerhedsarmaturer" },
        { id: "gas-optaelling-materialer", label: "Optælling af materialer" }
      ],
      vand: [
        { id: "vand-trykproevning", label: "Trykprøvning" },
        { id: "vand-tapsteder", label: "Afprøvning af tapsteder" },
        { id: "vand-varmtvandstemp", label: "Varmtvandstemp." },
        { id: "vand-cirkulation", label: "Cirkulation" },
        { id: "vand-sikkerhedsarmaturer", label: "Sikkerhedsarmaturer" },
        { id: "vand-optaelling-materialer", label: "Optælling af materialer" }
      ],
      aflob: [
        { id: "aflob-taethed", label: "Tæthedsprøvning" },
        { id: "aflob-installationsgenstande", label: "Afprøvning af installationsgenstande" },
        { id: "aflob-optaelling-materialer", label: "Optælling af materialer" }
      ]
    }
  },
  {
    id: "drift-vedligehold",
    title: "Drift og vedligehold",
    items: {
      gasVarme: [
        { id: "gas-driftsinstruktion", label: "Driftsinstruktion" },
        { id: "gas-vedligehold", label: "Vedligeholdsinstruktion" },
        { id: "gas-ventiler", label: "Ventiler og komponenter" },
        { id: "gas-saerlige", label: "Særlige komponenter" }
      ],
      vand: [
        { id: "vand-driftsinstruktion", label: "Driftsinstruktion" },
        { id: "vand-vedligehold", label: "Vedligeholdsinstruktion" },
        { id: "vand-ventiler", label: "Ventiler og armaturer" },
        { id: "vand-saerlige", label: "Særlige komponenter" }
      ],
      aflob: [
        { id: "aflob-driftsinstruktion", label: "Driftsinstruktion" },
        { id: "aflob-vedligehold", label: "Vedligeholdsinstruktion" },
        { id: "aflob-brugervejledning", label: "Brugervejledning" },
        { id: "aflob-saerlige", label: "Særlige komponenter" }
      ]
    }
  }
];

export const closureFlags: Array<{
  id: ClosureFlag;
  label: string;
}> = [
  { id: "ikkeFaerdig", label: "Ikke færdig" },
  { id: "faerdig", label: "Færdig" },
  { id: "tegninger", label: "Tegninger" },
  { id: "faerdigmelding", label: "Færdigmelding" },
  { id: "driftVedligehold", label: "Drifts- og vedligeholdelsesinstruktioner" },
  { id: "klarTilFaktura", label: "Klar til faktura" }
];
