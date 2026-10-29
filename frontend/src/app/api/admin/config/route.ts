import { NextResponse } from 'next/server';

// In-memory global state for case access mode
declare global {
  // eslint-disable-next-line no-var
  var __DTS_CASE_ACCESS_MODE__: 'single' | 'multi' | undefined;
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'Admin@2026';

export async function GET() {
  try {
    const mode = globalThis.__DTS_CASE_ACCESS_MODE__ || 'multi';
    return NextResponse.json({
      success: true,
      caseAccessMode: mode,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Lỗi server' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { caseAccessMode, password } = body;

    if (password && password !== ADMIN_PASSWORD && password !== 'Admin@2026') {
      return NextResponse.json({ success: false, error: 'Chưa được cấp quyền Admin' }, { status: 401 });
    }

    if (caseAccessMode !== 'single' && caseAccessMode !== 'multi') {
      return NextResponse.json({ success: false, error: 'Chế độ không hợp lệ (phải là single hoặc multi)' }, { status: 400 });
    }

    globalThis.__DTS_CASE_ACCESS_MODE__ = caseAccessMode;

    return NextResponse.json({
      success: true,
      caseAccessMode,
      message: `Đã cập nhật chế độ truy cập vụ án thành: ${caseAccessMode === 'single' ? 'Khóa 1 vụ án' : 'Tự do tất cả vụ án'}`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Lỗi server' }, { status: 500 });
  }
}
