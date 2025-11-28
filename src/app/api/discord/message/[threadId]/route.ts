import { authOptions } from "@/app/api/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function PATCH(
    request: Request,
    { params }: { params: { threadId: string } }) {
    try {
        const session = (await getServerSession(authOptions)) as any;

        if (!session?.accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const reqBody = await request.json();
        const { threadId } = params;
        const botApiUrl = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001';
        const response = await fetch(`${botApiUrl}/api/update-thread-message/${threadId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${session?.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reqBody),
        });
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Failed to fetch channel tags:', error);
        return NextResponse.json({ error: 'Failed to fetch channel tags' }, { status: 500 });
    }
}