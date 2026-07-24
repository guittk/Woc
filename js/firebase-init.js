const firebaseConfig = {
  apiKey: "AIzaSyCzDmqF8VKizGmJjNEk51nQfUyK-u_Byzw",
  authDomain: "wocestofados.firebaseapp.com",
  databaseURL: "https://wocestofados-default-rtdb.firebaseio.com",
  projectId: "wocestofados",
  storageBucket: "wocestofados.firebasestorage.app",
  messagingSenderId: "441278932888",
  appId: "1:441278932888:web:24ce9499e80ee06b7daded"
};

firebase.initializeApp(firebaseConfig);

const wocAuth = firebase.auth ? firebase.auth() : null;
const wocDb = firebase.database();
