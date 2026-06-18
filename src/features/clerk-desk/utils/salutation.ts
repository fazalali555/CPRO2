import {
  detectGenderFromText,
} from '@/utils/departmentDetector'

// Rank hierarchy — higher number = higher rank
const RANK_MAP: Record<string, number> = {
  // Top level
  'DIRECTOR GENERAL': 10,
  'DIRECTOR': 9,
  'DEPUTY DIRECTOR': 8,
  'DDE': 8,
  // District level
  'DISTRICT EDUCATION OFFICER': 7,
  'DEO': 7,
  'DEPUTY COMMISSIONER': 7,
  'DISTRICT POLICE OFFICER': 7,
  // Sub-district level
  'SUB DIVISIONAL EDUCATION OFFICER': 6,
  'SDEO': 6,
  'ASSISTANT COMMISSIONER': 6,
  // School heads
  'PRINCIPAL': 5,
  'HEADMASTER': 4,
  'HEADMISTRESS': 4,
  'HEAD MISTRESS': 4,
  'HEAD MASTER': 4,
  'IN-CHARGE': 3,
  // Teaching staff
  'LECTURER': 3,
  'SST': 2,
  'PST': 1,
  'CT': 1,
  'SPST': 1,
  'AT': 1,
  // Non-teaching
  'CLERK': 0,
  'SWEEPER': 0,
  'CHOWKIDAR': 0,
  'PEON': 0,
  'NAIB QASID': 0,
}

function getRank(text: string): number {
  const upper = text.toUpperCase()
  let maxRank = -1
  for (const [key, rank] of Object.entries(RANK_MAP)) {
    if (upper.includes(key)) {
      maxRank = Math.max(maxRank, rank)
    }
  }
  return maxRank
}

function isEmployee(text: string): boolean {
  // Named person with Mr./Mst./Mrs./Miss prefix
  if (/^(Mr\.|Mrs\.|Mst\.|Miss|Dr\.)\s/i
    .test(text.trim())) return true
  // Low rank designation
  const rank = getRank(text)
  return rank >= 0 && rank <= 3
}

function isInstitution(text: string): boolean {
  const upper = text.toUpperCase()
  return (
    upper.includes('SCHOOL') ||
    upper.includes('COLLEGE') ||
    upper.includes('OFFICE OF') ||
    upper.includes('GPS ') ||
    upper.includes('GHS ') ||
    upper.includes('GHSS ') ||
    upper.includes('GGHS') ||
    upper.includes('GGPS')
  )
}

function isOfficer(text: string): boolean {
  return getRank(text) >= 4
}

export function getSmartSalutation(
  to: string,
  from: string = '',
  letterType: string = 'Letter'
): string {
  if (!to?.trim()) return ''

  // No salutation for orders/notifications
  const noSalutationTypes = [
    'Office Order', 'Order', 'Notification',
    'Transfer Order', 'Circular',
  ]
  if (noSalutationTypes.includes(letterType))
    return ''

  const toUpper = to.toUpperCase()
  const fromUpper = from.toUpperCase()
  const gender = detectGenderFromText(to)
  const fromRank = getRank(from)
  const toRank = getRank(to)

  // ── RULE 1: Officer writing DOWN to employee ──
  // If sender rank > receiver rank → MEMO (no salutation)
  if (fromRank > toRank && toRank >= 0) {
    return 'MEMO'
  }

  // ── RULE 2: Writing to named employee ──
  // Mr./Mst./Mrs./Miss = employee memo
  if (isEmployee(to) && fromRank >= 4) {
    return 'MEMO'
  }

  // ── RULE 3: Writing to group of employees ──
  if (
    toUpper.includes('ALL ') ||
    toUpper.includes('CONCERNED') ||
    toUpper.includes('FOLLOWING') ||
    (toUpper.includes('PST') && fromRank >= 4) ||
    (toUpper.includes('SST') && fromRank >= 4) ||
    (toUpper.includes('TEACHER') && fromRank >= 4)
  ) {
    return 'MEMO'
  }

  // ── RULE 4: Writing to institution ──
  if (isInstitution(to)) {
    return 'MEMO'
  }

  // ── RULE 5: Show Cause Notice ──
  if (letterType === 'Show Cause Notice') {
    return ''  // no salutation — starts with body
  }

  // ── RULE 6: Writing UP to officer ──
  // Employee/lower rank writing to higher officer
  if (toRank >= 4) {
    if (gender === 'Female') return 'Respected Madam,'
    if (gender === 'Male') return 'Respected Sir,'
    // No gender detected — check DEO/SDEO
    if (toUpper.includes('(F)') ||
        toUpper.includes('FEMALE') ||
        toUpper.includes('GIRLS'))
      return 'Respected Madam,'
    if (toUpper.includes('(M)') ||
        toUpper.includes('MALE'))
      return 'Respected Sir,'
    return 'Respected Sir/Madam,'
  }

  // ── RULE 7: Peer to peer ──
  if (fromRank === toRank) {
    if (gender === 'Female') return 'Respected Madam,'
    if (gender === 'Male') return 'Respected Sir,'
    return 'Respected Sir/Madam,'
  }

  // ── RULE 8: Named person to officer ──
  if (/^(Mr\.|Mrs\.|Mst\.|Miss|Dr\.)\s/i
    .test(to.trim())) {
    const isFemale = /^(Mrs\.|Mst\.|Miss)/i
      .test(to.trim())
    return isFemale
      ? 'Respected Madam,'
      : 'Respected Sir,'
  }

  // Fallback
  return 'Sir,'
}

// Also export a helper to get letter opening line
export function getOpeningLine(
  to: string,
  from: string = '',
  letterType: string = 'Letter'
): string {
  const sal = getSmartSalutation(to, from, letterType)
  if (sal === 'MEMO') return 'MEMO'
  if (!sal) return ''
  // Higher office writes formally
  const fromRank = getRank(from)
  if (fromRank >= 7) {
    return 'I am directed to refer to the subject ' +
      'noted above and to state that'
  }
  return 'I have the honour to state that'
}