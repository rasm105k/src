import { z } from "zod";
import type { InstallationType, WorkKind, ClosureFlag, CheckedItem } from "./domain-types";

export const installationTypeSchema = z.enum(["gas", "vand", "aflob", "varme"]);
export const workKindSchema = z.enum(["nyInstallation", "aendring", "reparation", "serviceAndet"]);
export const closureFlagSchema = z.enum([
  "ikkeFaerdig",
  "faerdig",
  "tegninger",
  "faerdigmelding",
  "driftVedligehold",
  "klarTilFaktura",
]);

export const checkedItemSchema = z.object({
  id: z.string(),
  label: z.string(),
}) satisfies z.ZodType<CheckedItem>;

export const installationTypeArraySchema = z.array(installationTypeSchema);
export const workKindArraySchema = z.array(workKindSchema);
export const closureFlagArraySchema = z.array(closureFlagSchema);
export const checkedItemArraySchema = z.array(checkedItemSchema);

export type ParsedInstallationType = z.infer<typeof installationTypeSchema>;
export type ParsedWorkKind = z.infer<typeof workKindSchema>;
export type ParsedClosureFlag = z.infer<typeof closureFlagSchema>;
export type ParsedCheckedItem = z.infer<typeof checkedItemSchema>;
