import { NextResponse } from 'next/server';
import Papa from 'papaparse';

export const revalidate = 0;

export async function GET() {
  const sheetId = process.env.GOOGLE_SHEET_ID || '1M8qhJ5fjElvovbzkJtlEGqXKoCVTtmu7woD6n3ppVFE'; 
  const gid = '1094594370'; // 2026-SHORT Sheet GID
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

  try {
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch from Google Sheets: ${response.status} ${response.statusText}`);
    }
    
    const csvData = await response.text();
    
    // Parse without headers to be safer with column positions
    const parsed = Papa.parse(csvData, {
      header: false,
      skipEmptyLines: true,
    });
    
    const rows = parsed.data as any[];

    if (!rows || rows.length <= 1) {
      return NextResponse.json({ success: true, data: [] });
    }
    
    // User mentioned:
    // A (0): PLOT NO
    // B (1): FARMER NAME
    // C (2): ID NO
    // D (3): BALANCE AMOUNT
    // E (4): LIST NO
    // F (5): BANKED DATE
    // G (6): BANK ACC. NO
    // H (7): BANK COAD
    
    // Skip header row
    const dataRows = rows.slice(1);

    const formattedData = dataRows.map((row: any) => ({
      plotNo: row[0] || '-',
      farmerName: row[1] || '-',
      idNo: row[2] || '-',
      balanceAmount: row[3] || '-',
      listNo: row[4] || '-',
      bankedDate: row[5] || '-',
      bankAccNo: row[6] || '-',
      bankCode: row[7] || '-',
    }));

    return NextResponse.json({ success: true, data: formattedData });

  } catch (error) {
    console.error('Error fetching old campaign data:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve old campaign data.' },
      { status: 500 }
    );
  }
}
