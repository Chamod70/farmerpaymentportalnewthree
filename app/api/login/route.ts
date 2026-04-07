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
    
    let role = '';
    let isValid = false;

    // Admin logic with two-tier access
    if (username === 'admin') {
      if (password === 'admin123') {
        role = 'admin';
        isValid = true;
      } else if (password === 'zone123') {
        role = 'officer';
        isValid = true;
      }
    } else {
      // Other users
      const VALID_USERS = {
        farmer1: "pass123",
        manager: "password"
      };
      const userPassword = VALID_USERS[username as keyof typeof VALID_USERS];
      if (userPassword && password === userPassword) {
        role = username;
        isValid = true;
      }
    }

    if (isValid) {
      const response = NextResponse.json({ success: true, username, role });
      response.cookies.set({
        name: 'auth_token',
        value: 'authenticated_' + username + '_' + role,
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
