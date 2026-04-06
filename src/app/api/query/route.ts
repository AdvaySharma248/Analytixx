import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { datasetId, question } = await request.json();

    if (!datasetId || !question) {
      return NextResponse.json(
        { error: 'Dataset ID and question are required' },
        { status: 400 }
      );
    }

    // Fetch dataset from database
    const dataset = await db.dataset.findUnique({
      where: { id: datasetId },
    });

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    const columns: string[] = JSON.parse(dataset.columns);
    const previewData: Record<string, unknown>[] = JSON.parse(dataset.dataPreview);

    // Build the AI prompt
    const systemPrompt = `You are a data analyst assistant. You analyze CSV data and provide insights.

Given the dataset with columns: ${columns.join(', ')}

And here is the data (preview):
${JSON.stringify(previewData, null, 2)}

Total rows in dataset: ${dataset.rowCount}

When answering:
1. Provide a clear, concise insight
2. Always respond with valid JSON in this exact format (no markdown, no code blocks, just raw JSON):
{
  "title": "Short descriptive title for this insight",
  "summary": "2-3 sentence summary of the finding in plain English",
  "chartType": "bar" | "line" | "pie" | "area",
  "chartData": [
    {"name": "label1", "value": 123},
    {"name": "label2", "value": 456}
  ]
}

Rules:
- chartData should have 3-10 data points
- For "top N" queries, use bar chart
- For "trend" or "over time" queries, use line or area chart
- For "distribution" or "breakdown" queries, use pie chart
- Use realistic numeric values based on the data patterns
- value should always be a number
- name should be a descriptive label`;

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: question },
      ],
      thinking: { type: 'disabled' },
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('Empty response from AI');
    }

    // Parse the JSON response
    let insightData: {
      title: string;
      summary: string;
      chartType: string;
      chartData: { name: string; value: number }[];
    };

    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      let jsonStr = responseText.trim();
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      // Also try to find JSON object directly
      if (!jsonStr.startsWith('{')) {
        const braceMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (braceMatch) {
          jsonStr = braceMatch[0];
        }
      }
      insightData = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('Failed to parse AI response:', responseText);
      // Fallback: create a basic insight from the text
      insightData = {
        title: `Analysis: ${question}`,
        summary: responseText.slice(0, 300),
        chartType: 'bar',
        chartData: [
          { name: 'Result 1', value: 75 },
          { name: 'Result 2', value: 60 },
          { name: 'Result 3', value: 45 },
        ],
      };
    }

    // Validate chart data
    const validChartTypes = ['bar', 'line', 'pie', 'area'];
    const chartType = validChartTypes.includes(insightData.chartType)
      ? insightData.chartType
      : 'bar';

    const chartData = Array.isArray(insightData.chartData)
      ? insightData.chartData
          .filter((d) => d && typeof d.name === 'string' && typeof d.value === 'number')
          .slice(0, 10)
          .map((d) => ({ name: String(d.name), value: Number(d.value) }))
      : [
          { name: 'A', value: 50 },
          { name: 'B', value: 30 },
          { name: 'C', value: 20 },
        ];

    // Save insight to database
    const now = new Date().toISOString();
    const insightId = uuidv4();
    const queryId = uuidv4();

    await db.insight.create({
      data: {
        id: insightId,
        datasetId,
        query: question,
        title: insightData.title || `Analysis: ${question}`,
        summary: insightData.summary || responseText.slice(0, 300),
        chartType,
        chartData: JSON.stringify(chartData),
      },
    });

    await db.query.create({
      data: {
        id: queryId,
        datasetId,
        question,
        response: insightData.summary || responseText.slice(0, 300),
      },
    });

    return NextResponse.json({
      id: insightId,
      queryId,
      datasetId,
      title: insightData.title || `Analysis: ${question}`,
      summary: insightData.summary || responseText.slice(0, 300),
      chartType,
      chartData,
      createdAt: now,
    });
  } catch (error) {
    console.error('Query error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze data. Please try again.' },
      { status: 500 }
    );
  }
}
