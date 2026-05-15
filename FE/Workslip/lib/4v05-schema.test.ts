import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  controlStates,
  getControlColumnsForInstallations,
  installationTypes,
  workKinds,
  type ActiveControlColumn,
  type InstallationType
} from "./4v05-schema";

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
});
