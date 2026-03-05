import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

export async function POST(req: NextRequest) {
  const { initData } = await req.json();
  if (!initData) {
    return NextResponse.json({ valid: false, error: 'initData lipsa' }, { status: 400 });
  }

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) {
    return NextResponse.json({ valid: false, error: 'hash lipsa' }, { status: 400 });
  }
  params.delete('hash');

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(process.env.BOT_TOKEN!)
    .digest();

  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (computedHash !== hash) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  const userParam = params.get('user');
  const user = userParam ? JSON.parse(userParam) : null;
  return NextResponse.json({ valid: true, user });
}
