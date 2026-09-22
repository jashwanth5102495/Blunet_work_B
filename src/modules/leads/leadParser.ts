import { parse as parseCsv } from 'csv-parse/sync';
import pdfParse from 'pdf-parse';
import * as xlsx from 'xlsx';
import { db } from '../../config/db.js';

export interface ParsedLeadItem {
  businessName: string;
  phone: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  source?: string;
  isValid: boolean;
  validationError?: string;
  isDuplicate?: boolean;
}

export interface ImportPreviewResult {
  detected: number;
  validCount: number;
  duplicateCount: number;
  invalidCount: number;
  validLeads: ParsedLeadItem[];
  duplicates: ParsedLeadItem[];
  invalidLeads: ParsedLeadItem[];
}

const normalizeKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, '');

const getRecordValue = (rec: Record<string, any>, possibleKeys: string[]): string => {
  const normKeys = possibleKeys.map(normalizeKey);
  for (const rawKey of Object.keys(rec)) {
    const normKey = normalizeKey(rawKey);
    if (normKeys.includes(normKey)) {
      const val = rec[rawKey];
      if (val !== undefined && val !== null) {
        if (typeof val === 'number') {
          return Number.isInteger(val) ? String(val) : val.toFixed(0);
        }
        return String(val).trim();
      }
    }
  }
  return '';
};

const BNAME_KEYS = [
  'businessname', 'business', 'companyname', 'company', 'name', 'leadname',
  'business_name', 'company_name', 'firm', 'organization', 'title', 'lead', 'client'
];
const PHONE_KEYS = [
  'phone', 'phonenumber', 'phone_number', 'contact', 'contactnumber', 'contact_number',
  'mobile', 'mobilenumber', 'mobile_number', 'phoneno', 'mobileno', 'tel', 'telephone',
  'mobile_no', 'phone_no', 'contacts', 'contactno', 'contact_no'
];
const EMAIL_KEYS = ['email', 'emailaddress', 'email_address', 'emailid', 'email_id', 'mail'];
const WEBSITE_KEYS = ['website', 'web', 'site', 'url', 'domain'];
const ADDRESS_KEYS = ['address', 'location', 'street', 'address1', 'address_line'];
const CITY_KEYS = ['city', 'town'];
const STATE_KEYS = ['state', 'region', 'province'];
const COUNTRY_KEYS = ['country', 'nation'];
const SOURCE_KEYS = ['source', 'leadsource', 'lead_source'];

export const parseLeadFile = async (
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<ImportPreviewResult> => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  let rawItems: Partial<ParsedLeadItem>[] = [];

  if (ext === 'csv' || mimeType.includes('csv')) {
    const csvContent = buffer.toString('utf-8');
    const records = parseCsv(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    rawItems = records.map((rec: any) => ({
      businessName: getRecordValue(rec, BNAME_KEYS),
      phone: getRecordValue(rec, PHONE_KEYS),
      email: getRecordValue(rec, EMAIL_KEYS),
      website: getRecordValue(rec, WEBSITE_KEYS),
      address: getRecordValue(rec, ADDRESS_KEYS),
      city: getRecordValue(rec, CITY_KEYS),
      state: getRecordValue(rec, STATE_KEYS),
      country: getRecordValue(rec, COUNTRY_KEYS) || 'India',
      source: getRecordValue(rec, SOURCE_KEYS) || 'CSV Import',
    }));
  } else if (ext === 'xlsx' || ext === 'xls' || mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const records = xlsx.utils.sheet_to_json(sheet) as Record<string, any>[];

    rawItems = records.map((rec: any) => ({
      businessName: getRecordValue(rec, BNAME_KEYS),
      phone: getRecordValue(rec, PHONE_KEYS),
      email: getRecordValue(rec, EMAIL_KEYS),
      website: getRecordValue(rec, WEBSITE_KEYS),
      address: getRecordValue(rec, ADDRESS_KEYS),
      city: getRecordValue(rec, CITY_KEYS),
      state: getRecordValue(rec, STATE_KEYS),
      country: getRecordValue(rec, COUNTRY_KEYS) || 'India',
      source: getRecordValue(rec, SOURCE_KEYS) || 'Excel Import',
    }));
  } else if (ext === 'pdf' || mimeType.includes('pdf')) {
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

    let currentLead: Partial<ParsedLeadItem> = {};
    for (const line of lines) {
      const emailMatch = line.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
      const phoneMatch = line.match(/(?:\+91[\s-]?)?[6-9]\d{9}|\d{3,5}[\s-]?\d{6,8}/);

      if (phoneMatch && !currentLead.phone) {
        currentLead.phone = phoneMatch[0];
      }
      if (emailMatch && !currentLead.email) {
        currentLead.email = emailMatch[0];
      }

      if (
        !currentLead.businessName &&
        line.length > 2 &&
        !emailMatch &&
        !phoneMatch &&
        !line.startsWith('Page') &&
        !line.startsWith('Lead')
      ) {
        // Strip leading numbers or bullets like "1.", "2)", etc.
        currentLead.businessName = line.replace(/^[0-9]+[\.\)\s-]+/, '').trim();
      }

      if (currentLead.businessName && currentLead.phone) {
        currentLead.source = 'PDF Import';
        currentLead.country = 'India';
        rawItems.push({ ...currentLead });
        currentLead = {};
      }
    }
  }

  // Deduplicate against existing DB leads
  const existingLeads = await db.lead.findMany({
    select: { phone: true, email: true },
  });
  const existingPhones = new Set(existingLeads.map((l) => l.phone.replace(/\D/g, '')));
  const existingEmails = new Set(existingLeads.map((l) => (l.email ? l.email.toLowerCase() : '')));

  const validLeads: ParsedLeadItem[] = [];
  const duplicates: ParsedLeadItem[] = [];
  const invalidLeads: ParsedLeadItem[] = [];

  for (const item of rawItems) {
    const bName = (item.businessName || '').trim();
    const rawPhone = (item.phone || '').trim();
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const email = (item.email || '').trim().toLowerCase();

    if (!bName) {
      invalidLeads.push({
        businessName: bName || 'Unknown Business',
        phone: rawPhone,
        email,
        isValid: false,
        validationError: 'Missing business name.',
      });
      continue;
    }

    if (!rawPhone || cleanPhone.length < 8) {
      invalidLeads.push({
        businessName: bName,
        phone: rawPhone,
        email,
        isValid: false,
        validationError: 'Invalid or missing phone number.',
      });
      continue;
    }

    // Format phone nicely: if cleanPhone is 10 digits starting with 6-9, format with +91
    let formattedPhone = rawPhone;
    if (cleanPhone.length === 10 && /^[6-9]/.test(cleanPhone)) {
      formattedPhone = `+91 ${cleanPhone}`;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      formattedPhone = `+91 ${cleanPhone.slice(2)}`;
    }

    const isDup = existingPhones.has(cleanPhone) || (email !== '' && existingEmails.has(email));
    const leadObj: ParsedLeadItem = {
      businessName: bName,
      phone: formattedPhone,
      email: email || undefined,
      website: item.website || undefined,
      address: item.address || undefined,
      city: item.city || undefined,
      state: item.state || undefined,
      country: item.country || 'India',
      source: item.source || 'Import File',
      isValid: !isDup,
      isDuplicate: isDup,
      validationError: isDup ? 'Duplicate phone or email exists in system.' : undefined,
    };

    if (isDup) {
      duplicates.push(leadObj);
    } else {
      validLeads.push(leadObj);
      existingPhones.add(cleanPhone);
      if (email) existingEmails.add(email);
    }
  }

  return {
    detected: rawItems.length,
    validCount: validLeads.length,
    duplicateCount: duplicates.length,
    invalidCount: invalidLeads.length,
    validLeads,
    duplicates,
    invalidLeads,
  };
};

