import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { code, studentName } = await request.json();
    if (code === 'AICDACRYPTOCTF' && studentName?.trim()) {
      return NextResponse.json({ 
        valid: true, 
        token: Buffer.from(`${studentName}-${Date.now()}`).toString('base64') 
      });
    }
    return NextResponse.json({ valid: false, message: 'Invalid Access Code' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }
}
