import { NextResponse } from 'next/server';

/**
 * API route to send push notifications to all users via OneSignal.
 * Requires ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY in environment variables.
 */
export async function POST(request: Request) {
  const { title, message, url } = await request.json();

  if (!title || !message) {
    return NextResponse.json({ success: false, error: 'Title and Message are required' }, { status: 400 });
  }

  const appId = process.env.ONESIGNAL_APP_ID || "cd58321e-12f6-4a62-8301-cc049ece1b1a";
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY || "os_v2_app_zvmdehqs6zfgfaybzqcj5tq3dkyjtlmiydqenhnbyw33knd2c3gy25elpgwi6f7aam2r7d3pgayo5rectmhddfg3vn64cpsv4gatsty";

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
