// Generate firebase-messaging-sw.js with environment variables at build time
const fs = require('fs');
const path = require('path');

const firebaseConfig = `firebase.initializeApp({
  apiKey: '${process.env.NEXT_PUBLIC_API_KEY || ''}',
  authDomain: '${process.env.NEXT_PUBLIC_AUTH_DOMAIN || ''}',
  projectId: '${process.env.NEXT_PUBLIC_PROJECT_ID || ''}',
  storageBucket: '${process.env.NEXT_PUBLIC_STORAGE_BUCKET || ''}',
  messagingSenderId: '${process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID || ''}',
  appId: '${process.env.NEXT_PUBLIC_APP_ID || ''}',
  measurementId: '${process.env.NEXT_PUBLIC_MEASUREMENT_ID || ''}',
});`;

// Read from template, write to public
const templatePath = path.join(__dirname, 'firebase-messaging-sw.template.js');
const outputPath = path.join(__dirname, '../public/firebase-messaging-sw.js');

let swContent = fs.readFileSync(templatePath, 'utf8');
swContent = swContent.replace('// __FIREBASE_CONFIG_PLACEHOLDER__', firebaseConfig);

fs.writeFileSync(outputPath, swContent);
console.log('Generated public/firebase-messaging-sw.js with Firebase config');
