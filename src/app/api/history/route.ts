import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const queries = await db.query.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const formatted = queries.map((q) => ({
      id: q.id,
      datasetId: q.datasetId,
      question: q.question,
      response: q.response,
      createdAt: q.createdAt,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Failed to fetch history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch query history' },
      { status: 500 }
    );
  }
}
