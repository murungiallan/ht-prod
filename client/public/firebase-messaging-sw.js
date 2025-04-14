importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

const firebaseConfig = {
    apiKey: "AIzaSyB2nu1-p-5K_tgRv5Lf_qz-sbqXJsKqmpI",
    authDomain: "healthtrack-9e36c.firebaseapp.com",
    databaseURL: "https://healthtrack-9e36c-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "healthtrack-9e36c",
    storageBucket: "healthtrack-9e36c.firebasestorage.app",
    messagingSenderId: "1042087950444",
    appId: "1:1042087950444:web:86cde0ce225628a8dfc049",
    measurementId: "G-4HWLRPEN7Y"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Received background message:", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "../assets/logo.png",
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});