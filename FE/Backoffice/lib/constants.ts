import type { InstallationType, WorkKind, ClosureFlag } from './types'

export const installationTypeLabels: Record<InstallationType, string> = {
  gas: 'Gas',
  vand: 'Vand',
  aflob: 'Afløb',
  varme: 'Varme',
}

export const workKindLabels: Record<WorkKind, string> = {
  nyInstallation: 'Ny installation',
  aendring: 'Ændring',
  reparation: 'Reparation',
  serviceAndet: 'Andet',
}

export const installationToControlColumns: Record<InstallationType, string> = {
  gas: 'gasVarme',
  varme: 'gasVarme',
  vand: 'vand',
  aflob: 'aflob',
}

export const closureFlagLabels: Record<ClosureFlag, string> = {
  ikkeFaerdig: 'Ikke færdig',
  faerdig: 'Færdig',
  tegninger: 'Tegninger',
  faerdigmelding: 'Færdigmelding',
  driftVedligehold: 'Drifts- og vedligeholdelsesinstruktioner',
  klarTilFaktura: 'Klar til faktura',
}

export const instColors: Record<InstallationType, string> = {
  gas: 'text-orange-700 bg-orange-50 ring-orange-600/20',
  vand: 'text-cyan-700 bg-cyan-50 ring-cyan-600/20',
  aflob: 'text-stone-700 bg-stone-50 ring-stone-600/20',
  varme: 'text-rose-700 bg-rose-50 ring-rose-600/20',
}

export const instList: InstallationType[] = ['gas', 'vand', 'aflob', 'varme']
export const workKindList: WorkKind[] = ['nyInstallation', 'aendring', 'reparation', 'serviceAndet']
export const closureFlagList: ClosureFlag[] = ['ikkeFaerdig', 'faerdig', 'tegninger', 'faerdigmelding', 'driftVedligehold', 'klarTilFaktura']
