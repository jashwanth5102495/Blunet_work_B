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
      businessName: rec['Business Name'] || rec['Company'] || rec['businessName'] || rec['name'] || '',
      phone: rec['Phone'] || rec['Phone Number'] || rec['phone'] || rec['mobile'] || '',
      email: rec['Email'] || rec['email'] || '',
      website: rec['Website'] || rec['website'] || '',
      address: rec['Address'] || rec['address'] || '',
      city: rec['City'] || rec['city'] || '',
      state: rec['State'] || rec['state'] || '',
      country: rec['Country'] || rec['country'] || 'India',
      source: rec['Source'] || rec['source'] || 'Import File',
    }));
  } else if (ext === 'xlsx' || ext === 'xls' || mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const records = xlsx.utils.sheet_to_json(sheet);

    rawItems = records.map((rec: any) => ({
      businessName: rec['Business Name'] || rec['Company'] || rec['businessName'] || rec['Name'] || '',
      phone: String(rec['Phone'] || rec['Phone Number'] || rec['phone'] || rec['Mobile'] || ''),
      email: rec['Email'] || rec['email'] || '',
      website: rec['Website'] || rec['website'] || '',
      address: rec['Address'] || rec['address'] || '',
      city: rec['City'] || rec['city'] || '',
      state: rec['State'] || rec['state'] || '',
      country: rec['Country'] || rec['country'] || 'India',
      source: rec['Source'] || rec['source'] || 'Import File',
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

      if (!currentLead.businessName && line.length > 3 && !emailMatch && !phoneMatch && !line.startsWith('Page') && !line.startsWith('Lead')) {
        currentLead.businessName = line;
      }

      // When we have businessName and phone, push lead item
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

    const isDup = existingPhones.has(cleanPhone) || (email !== '' && existingEmails.has(email));
    const leadObj: ParsedLeadItem = {
      businessName: bName,
      phone: rawPhone,
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
