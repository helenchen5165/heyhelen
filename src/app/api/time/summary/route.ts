import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // mock数据，后续可替换为真实聚合
  const summary = {
    total: 10080,
    recorded: 8000,
    efficiency: 79.4,
    production: 3200,
    investment: 1200,
    expense: 800,
    unrecorded: 2080,
  };
  return NextResponse.json({ summary });
} 