import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_DOCUMENT_API_BASE_URL = 'http://localhost:5262'

type ProxyRouteContext = {
  params: Promise<{
    path: string[]
  }>
}

export async function GET(request: NextRequest, context: ProxyRouteContext) {
  return forwardToDocumentApi(request, context)
}

export async function POST(request: NextRequest, context: ProxyRouteContext) {
  return forwardToDocumentApi(request, context)
}

export async function PATCH(request: NextRequest, context: ProxyRouteContext) {
  return forwardToDocumentApi(request, context)
}

export async function DELETE(request: NextRequest, context: ProxyRouteContext) {
  return forwardToDocumentApi(request, context)
}

async function forwardToDocumentApi(request: NextRequest, context: ProxyRouteContext) {
  const { path } = await context.params
  const upstreamUrl = buildUpstreamUrl(path, request.nextUrl.search)
  const headers = new Headers()

  const accept = request.headers.get('accept')
  const contentType = request.headers.get('content-type')
  if (accept) headers.set('accept', accept)
  if (contentType) headers.set('content-type', contentType)

  try {
    const body = shouldForwardBody(request.method) ? await request.text() : undefined
    const upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: body || undefined,
      cache: 'no-store',
    })
    const responseBody = canHaveResponseBody(upstreamResponse.status)
      ? await upstreamResponse.arrayBuffer()
      : null

    return new NextResponse(responseBody, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders(upstreamResponse),
    })
  } catch (error) {
    return NextResponse.json(
      {
        message: 'Backoffice kunne ikke kontakte DocumentApi',
        detail: error instanceof Error ? error.message : 'Ukendt netværksfejl',
        target: upstreamUrl,
      },
      { status: 502 },
    )
  }
}

function buildUpstreamUrl(path: string[], search: string): string {
  const baseUrl =
    process.env.DOCUMENT_API_BASE_URL ||
    process.env.NEXT_PUBLIC_DOCUMENT_API_BASE_URL ||
    DEFAULT_DOCUMENT_API_BASE_URL

  const encodedPath = path.map(segment => encodeURIComponent(segment)).join('/')
  const url = new URL(`/api/${encodedPath}`, baseUrl)
  url.search = search
  return url.toString()
}

function responseHeaders(response: Response): Headers {
  const headers = new Headers()
  const contentType = response.headers.get('content-type')
  if (contentType) headers.set('content-type', contentType)
  return headers
}

function shouldForwardBody(method: string): boolean {
  return method !== 'GET' && method !== 'HEAD'
}

function canHaveResponseBody(status: number): boolean {
  return status !== 204 && status !== 304
}
