import { NextResponse } from 'next/server';

// In a real application, connect this to a Database.
// For now, hardcoded valid users here.
const VALID_USERS = {
  admin: "zone123",
  farmer1: "pass123",
  manager: "password"
};

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const userPassword = VALID_USERS[username as keyof typeof VALID_USERS];

    if (userPassword && password === userPassword) {
      const response = NextResponse.json({ success: true, username });
      response.cookies.set({
        name: 'auth_token',
        value: 'authenticated_' + username,
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
      return response;
    }

    return NextResponse.json(
      { success: false, message: 'Invalid username or password' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Bad request' },
      { status: 400 }
    );
  }
}
