#!/usr/bin/env node
/**
 * CLI script to send push notifications via Firebase Cloud Messaging
 * 
 * Usage:
 *   node scripts/send-notification.js "Title" "Body message" "/url"
 * 
 * Examples:
 *   node scripts/send-notification.js "New Feature! 🎉" "Check out our new carousel editor" "/carousel"
 *   node scripts/send-notification.js "Time to create! ✨" "Your next design is waiting"
 * 
 * Prerequisites:
 * 1. Set up Firebase project with Cloud Messaging enabled
 * 2. Add Firebase Admin credentials to .env.local
 * 3. Add NOTIFICATION_API_KEY to .env.local
 * 4. Have users subscribed via the settings page
 */

require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.NOTIFICATION_API_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

if (!API_KEY) {
  console.error('❌ Missing NOTIFICATION_API_KEY in .env.local');
  console.log('\nAdd to .env.local:');
  console.log('NOTIFICATION_API_KEY=your_secret_api_key');
  process.exit(1);
}

// Get arguments
const [,, title, body, url] = process.argv;

if (!title) {
  console.log('Usage: node scripts/send-notification.js "Title" "Body" "/url"');
  console.log('\nExample notifications:');
  console.log('  "Time to create! ✨" "Your next design is waiting" "/app"');
  console.log('  "New Feature! 🎉" "Try our new chart maker" "/chart"');
  console.log('  "Design tip 💡" "Use gradients for eye-catching backgrounds" "/editor"');
  process.exit(1);
}

async function sendNotification() {
  console.log('\n📤 Sending notification...');
  console.log(`   Title: ${title}`);
  console.log(`   Body: ${body || '(none)'}`);
  console.log(`   URL: ${url || '/app'}`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({
        title,
        body: body || '',
        url: url || '/app',
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('\n❌ Failed:', result.error || 'Unknown error');
      process.exit(1);
    }

    console.log('\n✅ Success!');
    if (result.totalSubscribers !== undefined) {
      console.log(`   Total subscribers: ${result.totalSubscribers}`);
      console.log(`   Delivered: ${result.successCount}`);
      console.log(`   Failed: ${result.failureCount}`);
      if (result.cleanedUpTokens > 0) {
        console.log(`   Cleaned up invalid tokens: ${result.cleanedUpTokens}`);
      }
    } else {
      console.log(`   ${result.message || 'Notification sent'}`);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\nMake sure your dev server is running or use the production URL.');
    process.exit(1);
  }
}

sendNotification();
