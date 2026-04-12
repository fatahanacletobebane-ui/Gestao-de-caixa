// Configuração Firebase - Moz Vendas Pro
const firebaseConfig = {
    apiKey: "AIzaSyBtEE6FKPFH9Bv2DhZNlb865iVsaX_2kpw",
    authDomain: "casa-de-jogos-ed385.firebaseapp.com",
    databaseURL: "https://casa-de-jogos-ed385-default-rtdb.firebaseio.com",
    projectId: "casa-de-jogos-ed385",
    storageBucket: "casa-de-jogos-ed385.firebasestorage.app",
    messagingSenderId: "400751100510",
    appId: "1:400751100510:web:e195695191607d02e46acf",
    measurementId: "G-M77XQBB1TY"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// Referências globais
const dbRefs = {
    contas: database.ref('contas'),
    vendas: database.ref('vendas'),
    produtos: database.ref('produtos'),
    sequencias: database.ref('sequencias'),
    anulacoes: database.ref('anulacoes'),
    configuracoes: database.ref('configuracoes')
};

// Utilitários
const utils = {
    formatMoney: (value) => {
        return new Intl.NumberFormat('pt-MZ', {
            style: 'currency',
            currency: 'MZN',
            minimumFractionDigits: 2
        }).format(value);
    },
    
    formatDate: (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('pt-PT');
    },
    
    formatDateTime: (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('pt-PT');
    },
    
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    padNumber: (num, size) => {
        let s = num.toString();
        while (s.length < size) s = "0" + s;
        return s;
    }
};
