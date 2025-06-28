import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // In a real app, fetch data from your database
    const stats = {
      totalGuests: 142,
      occupiedRooms: 24,
      availableRooms: 12,
      todayCheckIns: 8,
      todayCheckOuts: 5,
      monthlyRevenue: 45280
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}