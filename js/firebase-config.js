// Config Firebase - SUA CONTA
const firebaseConfig = {
    apiKey: "AIzaSyBtEE6FKPFH9Bv2DhZNlb865iVsaX_2kpw",
    authDomain: "casa-de-jogos-ed385.firebaseapp.com",
    databaseURL: "https://casa-de-jogos-ed385-default-rtdb.firebaseio.com",
    projectId: "casa-de-jogos-ed385",
    storageBucket: "casa-de-jogos-ed385.firebasestorage.app",
    messagingSenderId: "400751100510",
    appId: "1:400751100510:web:e195695191607d02e46acf"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Referência base para contas
const db = {
    contas: database.ref('contas')
};

// Utilitários
const fmt = {
    money: (v) => new Intl.NumberFormat('pt-MZ', {style:'currency', currency:'MZN'}).format(v),
    data: (t) => new Date(t).toLocaleString('pt-PT'),
    numero: (n) => String(n).padStart(5, '0')
};
