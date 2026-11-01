import { NextRequest, NextResponse } from 'next/server';
import { getLLMProvider, VendorMessageRequest } from '@/lib/llm';

export async function POST(req: NextRequest) {
  try {
    const request: VendorMessageRequest = await req.json();
    const provider = getLLMProvider();
    const response = await provider.generateVendorMessage(request);

    return NextResponse.json({
      success: true,
      data: response
    });
  } catch (err: any) {
    console.error('API /api/vendor/message error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

