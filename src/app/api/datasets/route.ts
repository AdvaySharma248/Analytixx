import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const datasets = await db.dataset.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const formatted = datasets.map((ds) => ({
      id: ds.id,
      filename: ds.filename,
      rowCount: ds.rowCount,
      columnCount: ds.columnCount,
      columns: JSON.parse(ds.columns),
      dataPreview: JSON.parse(ds.dataPreview),
      fileSize: ds.fileSize,
      createdAt: ds.createdAt,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Failed to fetch datasets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch datasets' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Dataset ID is required' }, { status: 400 });
    }

    await db.dataset.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete dataset:', error);
    return NextResponse.json(
      { error: 'Failed to delete dataset' },
      { status: 500 }
    );
  }
}
