import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/options";
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { threadId: string } }
) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { threadId } = params;
    const botApiUrl = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001';
    const response = await fetch(`${botApiUrl}/api/threads/${threadId}/tags`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
    });
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching thread data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { threadId: string } }
) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { threadId } = params;
    const botApiUrl = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001';
    
    const response = await fetch(`${botApiUrl}/api/delete-thread/${threadId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error deleting thread:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
