import { authOptions } from "@/app/api/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: { id: string } }) {
    try {
        const session = (await getServerSession(authOptions)) as any;

        if (!session?.accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { id } = params;
        const botApiUrl = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001';
        const response = await fetch(`${botApiUrl}/api/channels/${id}/tags`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${session?.accessToken}`,
            }
        });
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Failed to fetch channel tags:', error);
        return NextResponse.json({ error: 'Failed to fetch channel tags' }, { status: 500 });
    }
}