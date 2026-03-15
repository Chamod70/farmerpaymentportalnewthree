import { NextResponse } from 'next/server';
import Papa from 'papaparse';

export const revalidate = 0; // Disable static caching so data updates instantly

export async function GET() {
  const sheetId = process.env.GOOGLE_SHEET_ID || '1M8qhJ5fjElvovbzkJtlEGqXKoCVTtmu7woD6n3ppVFE'; 
  // Google Sheets public CSV export link
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

  try {
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) {
        // If sheet is not actually public, this might fail
        throw new Error(`Failed to fetch from Google Sheets: ${response.status} ${response.statusText}`);
    }
    
    // Read the text stream directly
    const csvData = await response.text();
    
    // Parse CSV to JSON
    const parsed = Papa.parse(csvData, {
      header: true,      // Assume first row is header
      skipEmptyLines: true,
    });
    
    const rows = parsed.data as any[];

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }
    
    // In our CSV we expect columns exactly or similar to:
    // PLOT NO, FARMER NAME, ID NO, BALANCE AMOUNT, LIST NO, BANKED DATE
    // Since row keys are based on the actual header names, we iterate the headers based on the Object's first keys
    const headers = Object.keys(rows[0]);
    
    const formattedData = rows.map((row: any) => ({
      plotNo: row[headers[0]] || '-',
      farmerName: row[headers[1]] || '-',
      idNo: row[headers[2]] || '-',
      balanceAmount: row[headers[3]] || '-',
      listNo: row[headers[4]] || '-',
      bankedDate: row[headers[5]] || '-',
    }));

    return NextResponse.json({ success: true, data: formattedData });

  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve live data. Please ensure the Google Sheet is set to "Anyone with the link can view".' },
      { status: 500 }
    );
  }
}
