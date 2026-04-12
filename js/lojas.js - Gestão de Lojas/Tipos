const lojas = {
    tipos: {
        mercearia: { nome: 'Mercearia', icone: '🥖', cor: '#48bb78' },
        ferragem: { nome: 'Ferragem', icone: '🔧', cor: '#ed8936' },
        takeaway: { nome: 'Take Away', icone: '🍔', cor: '#e53e3e' },
        restaurante: { nome: 'Restaurante', icone: '🍽️', cor: '#9f7aea' },
        farmacia: { nome: 'Farmácia', icone: '💊', cor: '#38b2ac' },
        pastelaria: { nome: 'Pastelaria', icone: '🧁', cor: '#ed64a6' },
        outros: { nome: 'Outros', icone: '📦', cor: '#718096' }
    },
    
    lojaAtual: null,
    
    init() {
        // Listener do selector
        document.getElementById('lojaSelector').addEventListener('change', (e) => {
            this.selecionarLoja(e.target.value);
        });
    },
    
    selecionarLoja(tipoLoja) {
        if (!tipoLoja) {
            this.lojaAtual = null;
            document.getElementById('lojaAtualNome').textContent = 'Selecione uma loja';
            document.getElementById('lojaProdutosNome').textContent = 'Selecione uma loja';
            document.getElementById('listaProdutos').innerHTML = 
                '<p class="empty-state">Selecione uma loja para ver os produtos</p>';
            return;
        }
        
        this.lojaAtual = tipoLoja;
        const info = this.tipos[tipoLoja];
        
        // Atualizar UI
        document.getElementById('lojaAtualNome').textContent = info.nome;
        document.getElementById('lojaProdutosNome').textContent = info.nome;
        
        // Carregar produtos da loja
        produtos.carregarProdutos(tipoLoja);
        
        // Habilitar botão de venda
        document.getElementById('btnFinalizar').disabled = false;
    },
    
    getLojaAtual() {
        return this.lojaAtual;
    },
    
    getNomeLoja(tipo) {
        return this.tipos[tipo]?.nome || tipo;
    },
    
    getTodasLojas() {
        return Object.keys(this.tipos);
    }
};
