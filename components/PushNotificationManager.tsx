'use client';

import { useEffect } from 'react';

// Using environment variable for OneSignal App ID
const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

export default function PushNotificationManager() {
  useEffect(() => {
    // 1. Initialize OneSignal using the latest OneSignalDeferred pattern
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    
    // Check for App ID
    if (!ONESIGNAL_APP_ID) {
      console.warn("OneSignal App ID not found. Web Push is disabled.");
      return;
    }

    // Check if script already exists to avoid duplication
    if (document.getElementById('onesignal-sdk')) return;

    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.id = 'onesignal-sdk';
    script.async = true;
    script.onload = () => {
      window.OneSignalDeferred.push(async function(OneSignal: any) {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          safari_web_id: "web.onesignal.auto.5471d8be-b1e1-4541-9494-b7c1995ec0a1", 
          notifyButton: {
            enable: true,
            size: 'medium',
            theme: 'dark',
            position: 'bottom-right',
            offset: { bottom: '15px', right: '15px' },
            text: {
              'tip.state.unsubscribed': 'Get push notifications',
              'tip.state.subscribed': "You're subscribed to notifications",
              'tip.state.blocked': "You've blocked notifications",
              'message.prenotify': 'Click to subscribe to payment alerts',
              'message.action.subscribed': "Thanks for subscribing!",
              'message.action.resubscribed': "You're back!",
              'message.action.unsubscribed': "You won't receive notifications anymore",
              'dialog.main.title': 'FFP Alerts System',
              'dialog.main.button.subscribe': 'SUBSCRIBE',
              'dialog.main.button.unsubscribe': 'UNSUBSCRIBE',
              'dialog.blocked.title': 'Unblock Notifications',
              'dialog.blocked.message': "Follow these instructions to allow notifications:"
            }
          },
          allowLocalhostAsSecureOrigin: true,
          welcomeNotification: {
                "title": "FFP SHEET Live Updates",
                "message": "You'll now receive instant notifications about payment updates!",
                "url": "/"
          },
          promptOptions: {
              slidedown: {
                  enabled: true,
                  autoPrompt: true,
                  timeDelay: 5,
                  pageViews: 1,
                  actionMessage: "Would you like to receive payment update notifications?",
                  acceptButtonText: "YES, NOTIFY ME",
                  cancelButtonText: "NOT NOW"
              }
          }
        });
      });
    };
    document.head.appendChild(script);
  }, []);

  return null;
}

declare global {
  interface Window {
    OneSignal: any;
    OneSignalDeferred: any;
  }
}
