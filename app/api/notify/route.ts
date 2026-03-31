import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * API route to send push notifications to all users via OneSignal.
 * Requires ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY in environment variables.
 */
export async function POST(request: Request) {
  // Security Check: Only admin can send notifications
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (token !== 'authenticated_admin') {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required' }, { status: 403 });
  }

  const { title, message, url } = await request.json();

  if (!title || !message) {
    return NextResponse.json({ success: false, error: 'Title and Message are required' }, { status: 400 });
  }

  const appId = process.env.ONESIGNAL_APP_ID;
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !restApiKey) {
    return NextResponse.json({ success: false, error: 'OneSignal credentials are not configured in environment variables' }, { status: 500 });
  }

  const data = {
    app_id: appId,
    included_segments: ['All'],
    contents: { en: message },
    headings: { en: title },
    url: url || '/'
  };

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Key ${restApiKey}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok) {
        return NextResponse.json({ success: true, result });
    } else {
        return NextResponse.json({ success: false, error: result }, { status: response.status });
    }

  } catch (error: any) {
    console.error('Error sending push notification:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
