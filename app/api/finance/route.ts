import { NextResponse } from 'next/server';
import Papa from 'papaparse';

export const revalidate = 0;

export async function GET() {
  const sheetId = process.env.GOOGLE_SHEET_ID || '1M8qhJ5fjElvovbzkJtlEGqXKoCVTtmu7woD6n3ppVFE'; 
  const gid = '862031520'; // Sheet3 GID
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

  try {
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch from Google Sheets: ${response.status} ${response.statusText}`);
    }
    
    const csvData = await response.text();
    
    // Parse without headers to use column indices
    const parsed = Papa.parse(csvData, {
      header: false,
      skipEmptyLines: true,
    });
    
    const rows = parsed.data as any[];

    if (!rows || rows.length <= 1) {
      return NextResponse.json({ success: true, data: [] });
    }
    
    // User requested:
    // B (index 1): PLOT NO
    // C (index 2): FARMER NAME
    // I (index 8): DATE RECEIVED IN FINANCE
    // K (index 10): STATUS
    // F (index 5): AMOUNT
    
    // Skip header row
    const dataRows = rows.slice(1);
    
    const formattedData = dataRows.map((row: any) => ({
      plotNo: row[1] || '-',
      farmerName: row[2] || '-',
      dateReceived: row[8] || '-',
      status: row[10] || '-',
      amount: row[5] || '-',
    }));

    return NextResponse.json({ success: true, data: formattedData });

  } catch (error) {
    console.error('Error fetching finance data:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve finance data.' },
      { status: 500 }
    );
  }
}
