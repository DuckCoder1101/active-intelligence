importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAmG--Jvn34KG2r0utbfKB52Il0NmMU0wU',
  authDomain: 'activeimob-74a7d.firebaseapp.com',
  projectId: 'activeimob-74a7d',
  storageBucket: 'activeimob-74a7d.firebasestorage.app',
  messagingSenderId: '608016838706',
  appId: '1:608016838706:web:9b042877def62028fe8c2b',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification?.title ?? 'Guará', {
    body: payload.notification?.body,
    icon: '/icons/favicon.png',
    data: payload.data,
  });
});
