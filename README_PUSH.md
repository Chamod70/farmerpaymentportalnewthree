# Web Push Notification Setup Guide

I have successfully integrated **OneSignal Web Push Notifications** into your Next.js application. This setup allows you to send notifications to users even when their browser is closed.

### 🛠️ Completed Steps
1.  **Service Worker**: Created `public/OneSignalSDKWorker.js` to handle background pushes.
2.  **SDK Integration**: Added `PushNotificationManager.tsx` and integrated it into `layout.tsx`.
3.  **Admin Broadcast API**: Created `/api/notify` to allow sending messages to all subscribers.
4.  **Admin UI**: Added a "Send Push Notification" section inside your **Dashboard** (Menu -> Dashboard).

---

### 🚀 Finalizing the Setup (Action Required)

To make this functional, you need to create a free OneSignal account and connect it to your app.

#### 1. Create a OneSignal App
1.  Go to [OneSignal.com](https://onesignal.com/) and create a free account.
2.  Click **"New App/Website"**.
3.  Select **"Web Push"** and click Next.
4.  **Configure Web Push**:
    *   **Site Name**: FFP Sheet Portal
    *   **Site URL**: Your Vercel URL (e.g., `https://your-app.vercel.app`)
    *   **Auto Resubscribe**: Enable this.
5.  **Choose SDK**: Select **"Typical Site"**.
6.  **Permission Prompt Setup**: Add a "Slidedown" prompt (I have already configured the code for this).
7.  **Service Worker**: Since I've already added the files, you can skip their file upload instructions.

#### 2. Get Your Credentials
*   Go to **Settings -> Keys & IDs**.
*   Copy the **OneSignal App ID**.
*   Copy the **REST API Key**.

#### 3. Update Environment Variables
Add these to your `.env` file (local) and **Vercel Project Settings** (production):

```bash
NEXT_PUBLIC_ONESIGNAL_APP_ID="your-app-id-here"
ONESIGNAL_APP_ID="your-app-id-here"
ONESIGNAL_REST_API_KEY="your-rest-api-key-here"
```

---

### 📱 How it works for Users
1.  **Subscription**: When a user visits the site, after 5 seconds, they will see a prompt: *"Would you like to receive payment update notifications?"*.
2.  **Background Support**: Once they click "Allow", their browser registers the Service Worker. Even if they close the tab or the browser, they will receive notifications.
3.  **Broadcasting**: You can now open the **Dashboard** in your app, type a message, and click **"Broadcast to All Users"**. All subscribed officers/farmers will get the alert instantly.

> [!IMPORTANT]
> For Push Notifications to work on local development (`localhost`), OneSignal requires you to enable **"Allow Localhost as Secure Origin"** in the OneSignal dashboard settings.

---

### 📝 Files Modified/Created
*   `public/OneSignalSDKWorker.js` (Background Service Worker)
*   `components/PushNotificationManager.tsx` (Client-side Initialization)
*   `app/layout.tsx` (Global Registration)
*   `app/api/notify/route.ts` (Backend Sending Logic)
*   `app/page.tsx` (Admin UI controls)
