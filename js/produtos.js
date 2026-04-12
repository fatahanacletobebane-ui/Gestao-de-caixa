const produtos = {
    lista: [],
    
    init() {
        // Nada específico aqui, carregamento é por loja
    },
    
    carregarProdutos(tipoLoja) {
        const userKey = auth.getUserData()?.key;
        if (!userKey) return;
        
        const ref = dbRefs.contas.child(userKey).child('products').child(tipoLoja);
        
        ref.on('value', (snapshot) => {
            this.lista = [];
            const container = document.getElementById('listaProdutos');
            container.innerHTML = '';
            
            if (!snapshot.exists()) {
                container.innerHTML = '<p class="empty-state">Nenhum produto cadastrado</p>';
                this.renderizarTabela();
                return;
            }
            
            snapshot.forEach((child) => {
                const produto = { id: child.key, ...child.val() };
                this.lista.push(produto);
                this.renderizarCard(produto, container);
            });
            
            this.renderizarTabela();
        });
    },
    
    renderizarCard(produto, container) {
        const card = document.createElement('div');
        card.className = 'produto-card';
        card.onclick = () => vendas.adicionarAoCarrinho(produto);
        
        card.innerHTML = `
            <h4>${produto.nome}</h4>
            <div class="preco">${utils.formatMoney(produto.preco)}</div>
            <div class="stock">Stock: ${produto.quantidade || 0}</div>
        `;
        
        container.appendChild(card);
    },
    
    renderizarTabela() {
        const container = document.getElementById('tabelaProdutos');
        if (!lojas.getLojaAtual()) {
            container.innerHTML = '<p class="empty-state">Selecione uma loja</p>';
            return;
        }
        
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Preço</th>
                        <th>Stock</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        this.lista.forEach(p => {
            html += `
                <tr>
                    <td>${p.nome}</td>
                    <td>${utils.formatMoney(p.preco)}</td>
                    <td>${p.quantidade || 0}</td>
                    <td>
                        <button onclick="produtos.editar('${p.id}')">Editar</button>
                        <button onclick="produtos.excluir('${p.id}')">Excluir</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    },
    
    salvar(produto) {
        const userKey = auth.getUserData()?.key;
        const tipoLoja = lojas.getLojaAtual();
        if (!userKey || !tipoLoja) return;
        
        const ref = dbRefs.contas.child(userKey).child('products').child(tipoLoja);
        
        if (produto.id) {
            ref.child(produto.id).update(produto);
        } else {
            ref.push(produto);
        }
    },
    
    showModal() {
        // Implementar modal de produto
        alert('Funcionalidade de adicionar produto - implementar modal');
    }
};
