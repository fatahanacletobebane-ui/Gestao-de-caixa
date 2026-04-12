const app = {
    init() {
        auth.init();
    },
    
    showTab(tabName) {
        // Esconder todas as abas
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Mostrar aba selecionada
        document.getElementById(`tab-${tabName}`).classList.add('active');
        event.target.classList.add('active');
        
        // Atualizar dados específicos
        if (tabName === 'historico') {
            historico.carregarHistorico();
        }
    },
    
    logout() {
        auth.logout();
    }
};

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
