import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  controlStages,
  controlStates,
  getCategoryValidationErrors,
  getControlColumnsForInstallations,
  getControlStageValidationErrors,
  installationTypes,
  workKinds,
  type ActiveControlColumn,
  type InstallationType
} from "./4v05-schema.ts";

describe("4V05 installation categories", () => {
  it("keeps gas and varme as separate installation choices", () => {
    const ids = installationTypes.map((type) => type.id);

    assert.deepEqual(ids, ["gas", "vand", "aflob", "varme"]);
  });

  it("maps gas and varme to one shared control column without duplicates", () => {
    const selected: InstallationType[] = ["gas", "varme"];
    const columns: ActiveControlColumn[] = getControlColumnsForInstallations(selected);

    assert.deepEqual(columns, ["gasVarme"]);
  });

  it("keeps vand and aflob controls separate from gas and varme", () => {
    const selected: InstallationType[] = ["vand", "aflob", "varme"];
    const columns: ActiveControlColumn[] = getControlColumnsForInstallations(selected);

    assert.deepEqual(columns, ["gasVarme", "vand", "aflob"]);
  });

  it("marks Service/andet as the only work kind that needs custom text", () => {
    const customKinds = workKinds.filter((kind) => kind.requiresCustomText).map((kind) => kind.id);

    assert.deepEqual(customKinds, ["serviceAndet"]);
  });

  it("keeps the custom Andet helper empty because the custom text field explains itself", () => {
    const customKind = workKinds.find((kind) => kind.id === "serviceAndet");

    assert.equal(customKind?.helper, "");
  });

  it("uses a single checkbox state for control items", () => {
    assert.deepEqual(controlStates, ["checked"]);
  });

  it("matches the customer PDF control categories exactly", () => {
    const actual = Object.fromEntries(
      controlStages.map((stage) => [
        stage.title,
        {
          gasVarme: stage.items.gasVarme?.map((item) => item.label) ?? [],
          vand: stage.items.vand?.map((item) => item.label) ?? [],
          aflob: stage.items.aflob?.map((item) => item.label) ?? []
        }
      ])
    );

    assert.deepEqual(actual, {
      "Forundersøgelse": {
        gasVarme: ["Ansøgning på gas"],
        vand: ["Ansøgning på vand", "Vandkvalitet"],
        aflob: ["Ansøgning på afløb", "Fald på ledninger", "Udluftninger over tag", "Vakuumventiler"]
      },
      "Modtagekontrol": {
        gasVarme: ["Rør og fittings", "Armaturer", "Kedel / VVB", "Særlige komponenter"],
        vand: ["Rør og fittings", "Armaturer", "VVB / veksler", "Særlige komponenter"],
        aflob: ["Rør og fittings", "Installationsgenstande", "Særlige komponenter"]
      },
      "Udførelseskontrol": {
        gasVarme: ["Stikledning og indføring", "Rørophæng", "Tilslutning til varmtvandsforsyning"],
        vand: [
          "Stikledning og indføring",
          "Fordeler omløber fastsp.",
          "Samling af koblingsdåser",
          "Tilslutning til varmtvandsforsyning",
          "Fittings presset, samlet, loddet.",
          "Rør i vater og lod"
        ],
        aflob: ["Installationsgenstande", "Fald på ledninger"]
      },
      "Slutkontrol": {
        gasVarme: ["Tæthedsprøvning", "Funktionsafprøvning", "Sikkerhedsarmaturer", "Optælling af materialer"],
        vand: [
          "Trykprøvning",
          "Afprøvning af tapsteder",
          "Varmtvandstemp.",
          "Cirkulation",
          "Sikkerhedsarmaturer",
          "Optælling af materialer"
        ],
        aflob: ["Tæthedsprøvning", "Afprøvning af installationsgenstande", "Optælling af materialer"]
      },
      "Drift og vedligehold": {
        gasVarme: ["Driftsinstruktion", "Vedligeholdsinstruktion", "Ventiler og komponenter", "Særlige komponenter"],
        vand: ["Driftsinstruktion", "Vedligeholdsinstruktion", "Ventiler og armaturer", "Særlige komponenter"],
        aflob: ["Driftsinstruktion", "Vedligeholdsinstruktion", "Brugervejledning", "Særlige komponenter"]
      }
    });
  });

  it("shows one control-step error when no control point is checked", () => {
    const errors = getControlStageValidationErrors({
      selectedStageIds: ["slutkontrol"],
      checkedItemIds: [],
      activeColumns: ["vand"]
    });

    assert.deepEqual(errors, {
      _controls: "Du skal vælge mindst et kontrolpunkt for at gå videre"
    });
  });

  it("requires at least one checked subcategory before leaving the control step", () => {
    const errors = getControlStageValidationErrors({
      selectedStageIds: [],
      checkedItemIds: [],
      activeColumns: ["vand"]
    });

    assert.deepEqual(errors, {
      _controls: "Du skal vælge mindst et kontrolpunkt for at gå videre"
    });
  });

  it("accepts a selected control category when one relevant subcategory is checked", () => {
    const errors = getControlStageValidationErrors({
      selectedStageIds: ["slutkontrol"],
      checkedItemIds: ["vand-trykproevning"],
      activeColumns: ["vand"]
    });

    assert.deepEqual(errors, {});
  });

  it("requires at least one installation type and one work kind on the category step", () => {
    const errors = getCategoryValidationErrors({
      selectedInstallations: [],
      workKind: null,
      customWorkKind: ""
    });

    assert.deepEqual(errors, [
      "Vælg mindst én anlægstype.",
      "Vælg en arbejdstype."
    ]);
  });

  it("requires custom work text when Andet is selected", () => {
    const errors = getCategoryValidationErrors({
      selectedInstallations: ["vand"],
      workKind: "serviceAndet",
      customWorkKind: "   "
    });

    assert.deepEqual(errors, ["Skriv opgavetype i feltet."]);
  });

  it("accepts valid category selections", () => {
    const errors = getCategoryValidationErrors({
      selectedInstallations: ["vand"],
      workKind: "serviceAndet",
      customWorkKind: "Fejlsøgning"
    });

    assert.deepEqual(errors, []);
  });
});
