// app/api/socket/route.ts
import { NextResponse } from 'next/server';
import SocketService from '@/lib/socketService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize the socket service
    SocketService.getInstance();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Socket server error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start socket server' },
      { status: 500 }
    );
  }
}

export const config = {
  runtime: 'nodejs',
};