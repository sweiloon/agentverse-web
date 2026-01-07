import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://72.60.199.100:8001';

async function proxyRequest(
  request: NextRequest,
  path: string,
  method: string
): Promise<NextResponse> {
  // Build the backend URL
  const url = new URL(request.url);
  const backendPath = `/api/v1/${path}${url.search}`;
  const backendUrl = `${BACKEND_URL}${backendPath}`;

  // Build headers - forward important headers from client request
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Forward authorization header from client if present
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    headers['Authorization'] = authHeader;
  } else {
    // Fallback: try to get token from session
    const session = await getServerSession(authOptions);
    if (session?.user?.accessToken) {
      headers['Authorization'] = `Bearer ${session.user.accessToken}`;
    }
  }

  // Forward relevant headers from the original request
  const forwardHeaders = ['accept', 'accept-language', 'content-type'];
  forwardHeaders.forEach(header => {
    const value = request.headers.get(header);
    if (value) {
      headers[header] = value;
    }
  });

  // Get request body for non-GET requests
  let body: string | undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      body = await request.text();
    } catch {
      // No body
    }
  }

  // Make the request with redirect: 'follow' to handle 307/308 internally
  try {
    const response = await fetch(backendUrl, {
      method,
      headers,
      body: body || undefined,
      redirect: 'follow', // Follow redirects on the server side
    });

    // Get response body
    const responseBody = await response.text();

    // Create response with same status and headers
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      // Don't forward these headers
      if (!['transfer-encoding', 'connection', 'keep-alive'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to connect to backend' },
      { status: 502 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path.join('/'), 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path.join('/'), 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path.join('/'), 'PUT');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path.join('/'), 'PATCH');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path.join('/'), 'DELETE');
}
