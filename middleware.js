import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = new URL(request.url);
  const ocid =
    url.searchParams.get('ocid') || request.nextUrl.searchParams.get('ocid');

  const response = NextResponse.next();

  if (ocid && isValidOcid(ocid)) {
    console.log('🆔 Middleware 攔截到 OCID:', ocid);
    response.headers.set('X-OCID-Captured', ocid);
    // TODO: 在這裡添加異步記錄邏輯
  } else {
    response.headers.set('X-OCID-Status', 'no-ocid-or-invalid');
    if (ocid) {
      response.headers.set('X-OCID-Value', ocid);
      response.headers.set('X-OCID-Length', ocid.length.toString());
    }
  }

  return response;
}

function isValidOcid(ocid) {
  return typeof ocid === 'string' && ocid.length >= 10 && ocid.length <= 50;
}

// Supports both a single string value or an array of matchers
export const config = {
  matcher: ['/api/:path*'],
};
