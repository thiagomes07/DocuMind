import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * GET /api/documents/[id]/status
 * Lightweight endpoint to check document processing status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Fetch document details from backend
    const response = await fetch(`${API_URL}/documents/${id}`, {
      headers: {
        Cookie: `access_token=${accessToken}`,
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || "Erro ao buscar documento" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract only status information to keep response lightweight
    const documentData = data.data || data;

    return NextResponse.json({
      id: documentData.id,
      status: documentData.status,
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: "Erro ao verificar status" },
      { status: 500 }
    );
  }
}
