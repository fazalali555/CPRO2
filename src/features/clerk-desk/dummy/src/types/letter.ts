export interface LetterData {
  sender: string;
  no: string;
  date: string;
  receiver: string;
  subject: string;
  body: string;
  signatureTitle: string;
  signatoryName: string;
  forwardings: string[];
  letterhead?: string;
  cc?: string;
}

export interface ParsedLetter {
  sender?: string;
  no?: string;
  date?: string;
  receiver?: string;
  subject?: string;
  body?: string;
  signatureTitle?: string;
  signatoryName?: string;
  forwardings?: string[];
  cc?: string;
}
