export type InstallationType = 'gas' | 'vand' | 'aflob' | 'varme';

export type WorkKind = 'nyInstallation' | 'aendring' | 'reparation' | 'serviceAndet';

export type ClosureFlag =
  | 'ikkeFaerdig'
  | 'faerdig'
  | 'tegninger'
  | 'faerdigmelding'
  | 'driftVedligehold'
  | 'klarTilFaktura';

export type CheckedItem = {
  id: string;
  label: string;
};
