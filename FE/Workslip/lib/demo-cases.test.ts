import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDraftFromCase,
  createBlankDraft,
  demoCases,
  getDraftProgress,
  getNextReportNumber,
  type WorkslipDraft
} from "./demo-cases.ts";

describe("demo cases", () => {
  it("ships with open cases for the installer queue", () => {
    assert.ok(demoCases.length >= 3);
    assert.ok(demoCases.every((item) => item.status === "open"));
  });

  it("prefills a 4V05 draft from the selected case", () => {
    const selectedCase = demoCases[0];
    const draft = buildDraftFromCase(selectedCase);

    assert.equal(draft.customerName, selectedCase.customerName);
    assert.equal(draft.address, selectedCase.address);
    assert.equal(draft.contactPerson, selectedCase.contactPerson);
    assert.equal(draft.phone, selectedCase.phone);
    assert.equal(draft.description, selectedCase.taskDescription);
    assert.equal(draft.date, selectedCase.scheduledDate);
    assert.equal(draft.currentStep, "report");
  });

  it("creates a blank new-case draft with the next report number", () => {
    const draft = createBlankDraft({
      reportNumber: getNextReportNumber(demoCases),
      scheduledDate: "2026-05-17"
    });

    assert.equal(draft.reportNumber, "1341");
    assert.equal(draft.date, "2026-05-17");
    assert.equal(draft.customerName, "");
    assert.equal(draft.description, "");
    assert.deepEqual(draft.selectedInstallations, []);
    assert.equal(Object.values(draft.controlValues).every((value) => value === false), true);
  });

  it("calculates draft progress from completed 4V05 sections", () => {
    const draft: WorkslipDraft = {
      ...buildDraftFromCase(demoCases[0]),
      selectedInstallations: ["vand"],
      workKind: "reparation",
      selectedControlStages: ["slutkontrol"],
      controlValues: {
        ...buildDraftFromCase(demoCases[0]).controlValues,
        "vand-trykproevning": true
      },
      closure: ["faerdig"]
    };

    assert.deepEqual(getDraftProgress(draft), {
      completed: 4,
      total: 4,
      label: "4/4"
    });
  });
});
