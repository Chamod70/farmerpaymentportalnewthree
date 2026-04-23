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
    
    // Parse CSV to JSON
    const parsed = Papa.parse(csvData, {
      header: true,      // Using headers because they might be in different positions
      skipEmptyLines: true,
    });
    
    const rows = parsed.data as any[];

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }
    
    // Normalize headers based on subagent findings:
    // BANK ACC. NO, BANK COAD
    const formattedData = rows.map((row: any) => ({
      plotNo: row['PLOT NO'] || '-',
      farmerName: row['FARMER NAME'] || '-',
      idNo: row['ID NO'] || '-',
      balanceAmount: row['BALANCE AMOUNT'] || '-',
      listNo: row['LIST NO'] || '-',
      bankedDate: row['BANKED DATE'] || '-',
      bankAccNo: row['BANK ACC. NO'] || row['BANK ACC NO'] || '-',
      bankCode: row['BANK COAD'] || row['BANK CODE'] || '-',
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
