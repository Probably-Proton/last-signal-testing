/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CLASSIFIED CASE OVERVIEW DOSSIERS — THE FIRST DIRECTIVE
 * 
 * Five historic Zodiac case overview records provided for investigator
 * familiarization during the First Directive orientation.
 * 
 * CRITICAL PRESERVATION NOTICE:
 * All texts, incident summaries, ballistic descriptions, typos, corrupted words,
 * and anomalous headers are preserved VERBATIM from the original archival scans.
 * Documents 2 and 4 are maintained as distinct records.
 */

export interface CaseDocumentItem {
  id: string;
  documentNumber: number;
  caseNumber: string;
  title: string;
  shortTitle: string;
  victimName: string;
  dateOfIncident: string;
  location: string;
  reportedBy: string;
  imagePath: string;
  isDraftOrCorrupted?: boolean;
  agencyHeader: {
    dept: string;
    subDept?: string;
    addressLines?: string[];
  };
  stamps: string[];
  summary: string;
  victimProfiles: string[];
  ballisticsAndPhysicalEvidence: string[];
  caseStatus: string;
  investigatorSignature: {
    signatureText: string;
    leadTitle: string;
    signedDate?: string;
    isHandwritten?: boolean;
  };
  footerNotice: string;
}

export const CLASSIFIED_CASE_DOCUMENTS: CaseDocumentItem[] = [
  {
    id: 'sfpd-1969-1011',
    documentNumber: 1,
    caseNumber: 'SFPD-1969-1011',
    title: 'CASE OVERVIEW - PAUL LEE STINE',
    shortTitle: 'Doc 01: Paul Lee Stine',
    victimName: 'Paul Lee Stine',
    dateOfIncident: '11 OCT 1969',
    location: 'WASHINGTON & CHERRY STS, PRESIDIO HEIGHTS, SF',
    reportedBy: 'INSPECTOR T. TOSCHI',
    imagePath: '/assets/aistudio/WhatsApp_Image_2026-10-29_at_7.00.46_PM__2__20ef5232.jpeg',
    isDraftOrCorrupted: false,
    agencyHeader: {
      dept: 'SAN FRANCISCO POLICE DEPARTMENT • HOMICIDE DETAIL',
      subDept: 'BUREAU OF INSPECTORS / RECORDS & EVIDENCE CONTROL',
    },
    stamps: ['CONFIDENTIAL', 'CONFIDENTIAL', 'CASE FILE - ACTIVE'],
    summary:
      "On the night of October 11, 1969, at approximately 9:55 PM, San Francisco taxi driver Paul Lee Stine was shot and killed. Stine had picked up a passenger in downtown San Francisco and driven to the Presidio Heights neighborhood. Upon reaching the intersection of Washington Street and Cherry Street, the suspect, described as a heavy-set white male wearing glasses, shot Stine in the right temple at close range. After the shooting, the suspect took Stine's wallet and cab keys, and deliberately tore away a large swatch of Stine's bloody shirt tail tail before walking away toward the Presidio. Teenagers across the street witnessed the murder from their window and immediately alerted the SFPD.",
    victimProfiles: [
      'PAUL LEE STINE (Age 29). Status: DECEASED (Shot once in the right temple at close range).',
    ],
    ballisticsAndPhysicalEvidence: [
      'Multiple pieces of key evidence are under analysis.',
      '1. BALLISTICS: The fatal shot was from a 9mm handgun.',
      "2. PHYSICAL EVIDENCE: Large sections of the victim's bloodied shirt tail were confirmed as missing.",
      "3. EVIDENCE MAILED: Within three days, the killer (the Zodiac) mailed letters to the San Francisco Chronicle containing a piece of the victim's bloody shirt as proof.",
      '4. COMPOSITE: Based on eyewitness accounts, a detailed composite sketch of the suspect was created.',
    ],
    caseStatus:
      'STATUS: UNSOLVED. The incident is classified as a homicide. Immediate context indicates a potential robbery, but letter communication subsequently claimed by "The Zodiac" has connected this killing to the multi-jurisdiction serial killer investigation. This is considered the final confirmed Zodiac Homicide. Investigation is ongoing by the SFPD Homicide Detail.',
    investigatorSignature: {
      signatureText: 'T. Toschi',
      leadTitle: 'INSPECTOR T. TOSCHI, LEAD INVESTIGATOR',
      isHandwritten: true,
    },
    footerNotice: 'DO NOT DUPLICATE',
  },
  {
    id: 'sol-1968-1220-draft',
    documentNumber: 2,
    caseNumber: 'SOL-1968-1220',
    title: 'CASE OVERVIEW - DAVID FARADAY & BETTY LOU JENSEN',
    shortTitle: 'Doc 02: Faraday & Jensen (Draft / Glitched)',
    victimName: 'David Faraday & Betty Lou Jensen',
    dateOfIncident: 'December 20, 1968',
    location: "Waker Lover's Lane, Benicia",
    reportedBy: 'SGT. R. HALSTEAD',
    imagePath: '/assets/aistudio/WhatsApp_Image_2026-10-29_at_7.00.46_PM__1__dc8203ea.jpeg',
    isDraftOrCorrupted: true,
    agencyHeader: {
      dept: 'CALIFORNIA DEPARTMENT OF JUSTICE',
      subDept: 'Solano Department',
      addressLines: [
        '32320 Calenns Ease Evidence NI 98020',
        "Waker Lover's Lane",
        'Benicia, 19673',
      ],
    },
    stamps: ['TOP SECRET', 'CONFIDENTIAL', 'DATE 05, 28 // RECORDS & EVIDENCE CONTROL'],
    summary:
      "On the night of December 20, 1968, at approximately 11:15 PM, hih Larm Arthur Betty Jensen were present at a Faraday and Betty Lou Jensen were present 's vehiced, Benicia. As they were parked in fcrraalant, ordering them to exit. The assailant rounds from a .22-caliber fatally wounding both individuals. The attacker fled the scene , leaving lititial evidence.",
    victimProfiles: [
      'VICTIM PROFILES - Victim 1 is David Arthur Faraday (Age 17), who was deceased at the scene from a single gunshot to the head. Victim 2 is Betty Lou Jensen (Age 16), who was also deceased at the scene from multiple gunshot wounds to the back.',
    ],
    ballisticsAndPhysicalEvidence: [
      "Multiple items were recovered from the scene, including Winchester Western Super-X brand .22 caliber ammuition, which atem are believeed. Tire tracks from a shot-out used. The front passenger window of Faraday's vehicle vehicle were also noted in the vicinity of the turnout.",
    ],
    caseStatus:
      "This double homicide remains an active unsolved case Sheriff's Department and Benicia Politice. Evidence links likis incident to the serial killer known as 'The Zodiac as Killer'. No viable suspects have been inspects bentif orr aprehrehended araproended as curr-ently exhausted. DO NOT DUPLICATE.",
    investigatorSignature: {
      signatureText: 'SGT. R. HALSTEAD',
      leadTitle: 'SGT. R. HALSTEAD',
      signedDate: 'DATE 05, 28 // RECORDS & EVIDENCE CONTROL',
      isHandwritten: false,
    },
    footerNotice: 'DO NOT DUPLICATE',
  },
  {
    id: 'nap-1969-0927',
    documentNumber: 3,
    caseNumber: 'NAP-11969-0927', // Preserved verbatim from title header
    title: 'CASE OVERVIEW - CECELIA SHEPARD',
    shortTitle: 'Doc 03: Cecelia Shepard',
    victimName: 'Cecelia Shepard & Bryan Calvin Hartnell',
    dateOfIncident: '27 SEP 1969',
    location: 'LAKE BERRYESSA (TWIN OAK RIDGE), NAPA COUNTY, CA',
    reportedBy: 'DEPUTY R. LANDS',
    imagePath: '/assets/aistudio/WhatsApp_Image_2026-10-29_at_7.00.46_PM_82bcbfb0.jpeg',
    isDraftOrCorrupted: false,
    agencyHeader: {
      dept: "NAPA COUNTY SHERIFF'S OFFICE • HOMICIDE DIVISION",
      subDept: 'BUREAU OF INVESTGATION / RECORDS & EVIDENCE CONTROL',
    },
    stamps: ['CONFIDENTIAL', 'CONFIDENTIAL', 'CASE FILE - ACTIVE'],
    summary:
      "On the evening of September 27, 1969, at approximately 6:15 PM, college students Bryan Calvin Hartnell and Cecelia Ann Shepard were present at Lake Berryessa's Twin Oak Ridge. They were approached by a male wearing a dark, executioner-style hood with a white crosshair symbol. The attacker bound them with plastic clothesline before repeatedly stabbing both victims with a large knife. The perpetrator then inscribed details on the door of Hartnell's parked vehicle before fleeing.",
    victimProfiles: [
      'CECILIIANN SHEPARD (Age 22). Deceased - succumbed to injuries on September 29, 1969. Multiple stab wounds.',
      'BRYAN CALVIN HARTNELL (Age 20). Survived - multiple stab wounds to back and abdomen. Recovering.',
    ],
    ballisticsAndPhysicalEvidence: [
      'Multiple pieces of key evidence are under analysis.',
      '1. BALLISTICS: N/A, non-firearm assault.',
      '2. PHYSICAL EVIDENCE: Large 10-to-12 inch clip-point knife identified as weapon.',
      "3. VEHICLE GRAFFITI: Victim's car door was inscribed with dates and crosshair symbol.",
      "4. BOOT FOOTPRINTS: Clear prints matching 'Wing Walker' boot size 10.5 found in shoreline mud.",
    ],
    caseStatus:
      'STATUS: UNSOLVED. The incident is classified as a double homicide/violent assault. Follow-up investigations and potential links to other area crimes are ongoing. Victim interviews and witness accounts provide key information. Extensive evidence processing is complete.',
    investigatorSignature: {
      signatureText: '_R. Lands_',
      leadTitle: 'DEPUTY R. LANDS, LEAD INVESTIGATOR',
      isHandwritten: true,
    },
    footerNotice: 'DO NOT DUPLICATE',
  },
  {
    id: 'sol-1968-1220-std',
    documentNumber: 4,
    caseNumber: 'SOL-1968-1220',
    title: 'CASE OVERVIEW - DAVID ARTHUR FARADAY',
    shortTitle: 'Doc 04: David Arthur Faraday (Standard)',
    victimName: 'David Arthur Faraday & Betty Lou Jensen',
    dateOfIncident: 'December 20, 1968',
    location: "Lake Herman Road Lover's Lane turnout, Benicia",
    reportedBy: 'SGT. R. HALSTEAD, LEAD INVESTIGATOR',
    imagePath: '/assets/aistudio/WhatsApp_Image_2026-10-29_at_7.00.45_PM_569a111e.jpeg',
    isDraftOrCorrupted: false,
    agencyHeader: {
      dept: 'CALIFORNIA DEPARTMENT OF JUSTICE',
      subDept: 'Solano Department',
      addressLines: [
        '32320 Calenns Ease Evidence NI 98020',
        "Waker Lover's Lane",
        'Benicia, 19673',
      ],
    },
    stamps: ['TOP SECRET', 'CONFIDENTIAL', 'CASE FILE - ACTIVE', 'DATE 05, 28 // RECORDS & EVIDENCE CONTROL'],
    summary:
      "On the evening of December 20, 1968, at approximately 11:15 PM, high school students David Arthur Faraday and Betty Lou Jensen were picnicking at a well-known Lover's Lane turnout along Lake Herman Road. Their vehicle, a 1960 Rambler station wagon, was parked with both occupants inside.\nAn unidentified assailant approached the vehicle, forced the occupants to exit, and fired multiple rounds from a .22-caliber firearm. Betty Lou Jensen was shot repeatedly in the back while attempting to flee and died at the scene. David Faraday was fatally shot in the right temple and succumbed to his injuries at the scene. The attacker then fled.",
    victimProfiles: [
      'DAVID ARTHUR FARADAY Atnhant (Age 17). Status: DECEASED (Shot once in the head at point-blank range). Junior student at Vallejo High School.',
    ],
    ballisticsAndPhysicalEvidence: [
      'Multiple .22 caliber shell casings, identified as Winchester Western Super-X brand, were recovered at the scene and are believed to match the weapon used. A significant number of casings (10 total) suggest a semiautomatic firearm. The vehicle\'s passenger window was shot out. Tire tracks from a different vehicle were noted near the turnout.',
    ],
    caseStatus:
      'STATUS: UNREVISED / UNSOLVED. The double homicide remains an active and open case under the jurisdiction of the Solano County Sheriff\'s Department and Benicia Police, attributed to the subject known as subjectnown as "The Zodiac Killer". All potential leads are current-ly exhausted. Further cross-referencing with other case data and potential cipher communications is ongoing.',
    investigatorSignature: {
      signatureText: 'SGT. R. HALSTEAD',
      leadTitle: 'SGT. R. HALSTEAD, LEAD INVESTIGATOR',
      signedDate: 'DATE 05, 28 // RECORDS & EVIDENCE CONTROL',
      isHandwritten: false,
    },
    footerNotice: 'DO NOT DUPLICATE',
  },
  {
    id: 'sol-1969-0704',
    documentNumber: 5,
    caseNumber: 'SOL-1969-0704',
    title: 'CASE OVERVIEW - MICHAEL V. MAGEAU',
    shortTitle: 'Doc 05: Michael V. Mageau',
    victimName: 'Michael V. Mageau & Darlene E. Ferrin',
    dateOfIncident: '04 JUL 1969',
    location: 'BLUE ROCK SPRINGS PARK, VALLEJO, CA',
    reportedBy: 'DEPUTY R. LANDS',
    imagePath: '/assets/aistudio/WhatsApp_Image_2026-10-29_at_7.00.44_PM_0541a9e0.jpeg',
    isDraftOrCorrupted: false,
    agencyHeader: {
      dept: 'SAN FRANCISCO POLICE DEPARTMENT • HOMICIDE DETAIL',
      subDept: 'BUREAU OF INSPECTORS / RECORDS & EVIDENCE CONTROL',
    },
    stamps: ['CONFIDENTIAL', 'CONFIDENTIAL', 'CASE FILE - ACTIVE'],
    summary:
      'On the night of July 4, 1969, at approximately 11:30 PM, on Blue Rock Springs Park, college students Michael V. Mageau and Darlene E. Ferrin were present in a remote turnout area. A suspect vehicle puled up ored them out. The suspect then fired multiple rounds from a 9mm semiautomatic handgun, fatally woundng Darlene Ferrin and severely injuring Michael Mageau. Extensive evidence collection is complete, maintaining realism.',
    victimProfiles: [
      'MICHAEL V. MAGEAU (Age 19). Status: SURVIVED (Severe gunshot wounds the new to the neck and face). Mageau was a resident of Vallejo, CA, and dean and vinecls that mageau vooms used atrincipees of the attacker and vehicle. Comprehensive medical recods are on file. He is a primary witness.',
    ],
    ballisticsAndPhysicalEvidence: [
      'Multiple pieces of key evidence are under analysis.',
      '1. BALLISTICS: The fatal shots are from a 9mm semiautomatic handgun. Multiple shell casings were recovered from the scene. Everinmendingt.',
      "2. PHYSICAL EVIDENCE: Michael Mageau's clothes were processed. Tire tracks from the suspect vehicle are documented.",
      '3. COMPOSITE: Based on Mageau\'s description, initial composite sketch parameters are being refined. Extensive scene preservation complete.',
    ],
    caseStatus:
      "STATUS: ACTIVE / UNSOLVED. The incident is classified as a double homicide. Initial investigation focused on potential local loctal suspects, but letter communication received by news outlets has subsequently linked this killing to the multi-jurisdiction serial killer investigation known as 'The Zodiac Killer. Extensive evidence processing is complete, and cross-referencing with other potential 'Cipher' communications is ongoing. Leads are currently exhausted. DO NOT DUPLICATE.",
    investigatorSignature: {
      signatureText: 'Lands',
      leadTitle: 'DEPUTY R. LANDS, LEAD INVESTIGATOR',
      isHandwritten: true,
    },
    footerNotice: 'DO NOT DUPLICATE',
  },
];
