import { Workslip } from './types'

const firstNames = [
  'Lars', 'Mette', 'Søren', 'Anne', 'Peter', 'Karen', 'Jens', 'Hanne',
  'Thomas', 'Lone', 'Henrik', 'Susanne', 'Niels', 'Pia', 'Morten', 'Tina',
  'Anders', 'Camilla', 'Jacob', 'Louise',
]

const lastNames = [
  'Nielsen', 'Jensen', 'Hansen', 'Pedersen', 'Andersen', 'Christensen',
  'Larsen', 'Sørensen', 'Rasmussen', 'Jørgensen', 'Madsen', 'Petersen',
]

const projects = [
  'Badeværelsesrenovering', 'Køkkenombygning', 'Tagudskiftning',
  'El-installation', 'VVS-arbejde', 'Malerservice', 'Gulvafslibning',
  'Hegn og have', 'Varmepumpe', 'Solceller', 'Isolering', 'Fjernvarme',
]

const descriptions = [
  'Udskiftning af gamle rør og installation af nyt gulvvarme',
  'Fuld renovering af køkken med nye skabe og bordplader',
  'Udskiftning af tagsten og lægter på helt hus',
  'Opsætning af nye stikkontakter og el-tavle',
  'Installation af ny varmtvandsbeholder og cirkulationspumpe',
  'Maling af stue, køkken og to værelser',
  'Slibning og lakering af egetræsgulv i stuen',
  'Opsætning af nyt hegn og anlæggelse af terrasse',
  'Installation af luft-til-vand varmepumpe',
  'Montering af solcellepaneler på tagflade mod syd',
  'Efterisolering af loft og skråvægge',
  'Tilslutning til fjernvarme og skift af radiatorer',
]

const statuses: Workslip['status'][] = ['pending', 'processing', 'completed', 'failed']

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDate(daysBack: number): string {
  const d = new Date()
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack))
  d.setHours(Math.floor(Math.random() * 12) + 8)
  d.setMinutes(Math.floor(Math.random() * 60))
  return d.toISOString()
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function generateMockWorkslips(count: number): Workslip[] {
  return Array.from({ length: count }, (_, i) => {
    const firstName = randomItem(firstNames)
    const lastName = randomItem(lastNames)
    const status = randomItem(statuses)
    const submitted = randomDate(60)
    const processed = status === 'completed' || status === 'failed'
      ? new Date(new Date(submitted).getTime() + Math.random() * 3600000 * 4).toISOString()
      : null

    return {
      id: `WSL-${String(i + 1).padStart(4, '0')}`,
      customerName: `${firstName} ${lastName}`,
      customerEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.dk`,
      customerPhone: `+45 ${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
      projectName: randomItem(projects),
      description: randomItem(descriptions),
      status,
      fileName: `dokument-${String(i + 1).padStart(3, '0')}.pdf`,
      fileSize: Math.floor(Math.random() * 5000000) + 100000,
      submittedAt: submitted,
      processedAt: processed,
      metadata: {},
    }
  })
}
