import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCU56P4IPwVXa_47jCjDAyZAAGClpXa388",
  authDomain: "prodex-e010b.firebaseapp.com",
  projectId: "prodex-e010b",
  storageBucket: "prodex-e010b.firebasestorage.app",
  messagingSenderId: "744611842921",
  appId: "1:744611842921:web:1eb89158a5e0f4d5930bf8"
};

const app = initializeApp(firebaseConfig);

export default app;