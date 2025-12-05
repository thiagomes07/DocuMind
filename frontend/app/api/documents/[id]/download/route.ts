import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const resolvedParams = await context.params;
    const documentId = resolvedParams?.id;

    if (!documentId) {
      return NextResponse.json(
        { message: 'Documento não informado' },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token');

    if (!accessToken) {
      return NextResponse.json(
        { message: 'Não autenticado' },
        { status: 401 },
      );
    }

    const backendResponse = await fetch(
      `${API_URL}/documents/${documentId}/download`,
      {
        headers: {
          Cookie: `access_token=${accessToken.value}`,
        },
        cache: 'no-store',
      },
    );

    if (!backendResponse.ok) {
      let errorPayload: unknown = null;
      try {
        errorPayload = await backendResponse.json();
      } catch {
        // ignore JSON parsing issues
      }

      const body =
        errorPayload && typeof errorPayload === 'object'
          ? errorPayload
          : { message: 'Erro ao baixar documento' };

      return NextResponse.json(body, {
        status: backendResponse.status,
      });
    }

    const fileBuffer = await backendResponse.arrayBuffer();
    const disposition =
      backendResponse.headers.get('content-disposition') ||
      `attachment; filename="document-${documentId}.pdf"`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': disposition,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Document download proxy error:', error);
    return NextResponse.json(
      { message: 'Erro ao gerar PDF' },
      { status: 500 },
    );
  }
}
