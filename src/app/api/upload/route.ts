import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Only CSV files are supported' }, { status: 400 });
    }

    // Limit file size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    const fileText = await file.text();

    // Parse CSV
    const parseResult = Papa.parse(fileText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });

    if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
      return NextResponse.json(
        { error: 'Failed to parse CSV file. Please check the format.' },
        { status: 400 }
      );
    }

    const rows = parseResult.data as Record<string, unknown>[];
    const columns = parseResult.meta.fields || [];

    // Clean column names
    const cleanColumns = columns.map((col) => col.trim()).filter(Boolean);

    // Prepare data preview (first 10 rows)
    const previewRows = rows.slice(0, 10).map((row) => {
      const cleanRow: Record<string, string | number | null> = {};
      for (const col of cleanColumns) {
        const val = row[col];
        cleanRow[col] = val != null ? (val as string | number) : null;
      }
      return cleanRow;
    });

    // Save to database
    const dataset = await db.dataset.create({
      data: {
        id: uuidv4(),
        filename: file.name,
        rowCount: rows.length,
        columnCount: cleanColumns.length,
        columns: JSON.stringify(cleanColumns),
        dataPreview: JSON.stringify(previewRows),
        fileSize: file.size,
      },
    });

    return NextResponse.json({
      id: dataset.id,
      filename: dataset.filename,
      rowCount: dataset.rowCount,
      columnCount: dataset.columnCount,
      columns: cleanColumns,
      dataPreview: previewRows,
      fileSize: dataset.fileSize,
      createdAt: dataset.createdAt,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    );
  }
}
