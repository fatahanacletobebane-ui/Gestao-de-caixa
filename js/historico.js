const historico = {
    vendas: [],
    
    init() {
        this.carregarHistorico();
        
        // Listeners de filtro
        document.getElementById('filtroDataInicio').valueAsDate = new Date();
        document.getElementById('filtroDataFim').valueAsDate = new Date();
    },
    
    carregarHistorico() {
        const userData = auth.getUserData();
        if (!userData) return;
        
        const ref = dbRefs.contas.child(userData.key).child('sales');
        
        ref.orderByChild('data').limitToLast(100).on('value', (snapshot) => {
            this.vendas = [];
            
            snapshot.forEach((child) => {
                this.vendas.push({
                    id: child.key,
                    ...child.val()
                });
            });
            
            // Ordenar decrescente
            this.vendas.sort((a, b) => b.data - a.data);
            
            this.renderizar();
        });
    },
    
    renderizar(vendasFiltradas = null) {
        const container = document.getElementById('listaHistorico');
        const lista = vendasFiltradas || this.vendas;
        
        if (lista.length === 0) {
            container.innerHTML = '<p class="empty-state">Nenhum documento encontrado</p>';
            return;
        }
        
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Nº</th>
                        <th>Tipo</th>
                        <th>Data</th>
                        <th>Cliente</th>
                        <th>Valor</th>
                        <th>Estado</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        lista.forEach(v => {
            const statusClass = v.anulado ? 'status-anulado' : 'status-ativo';
            const statusText = v.anulado ? 'ANULADO' : 'ATIVO';
            const rowClass = v.anulado ? 'doc-anulado' : '';
            
            html += `
                <tr class="${rowClass}">
                    <td>${v.numeroSequencial}</td>
                    <td>${v.tipoDocumento.replace('_', '-').toUpperCase()}</td>
                    <td>${v.dataFormatada}</td>
                    <td>${v.cliente.nome}</td>
                    <td>${utils.formatMoney(v.total)}</td>
                    <td class="${statusClass}">${statusText}</td>
                    <td>
                        <button onclick="historico.verDetalhes('${v.id}')">Ver</button>
                        ${!v.anulado ? `<button onclick="anulacoes.solicitarAnulacao('${v.id}', ${JSON.stringify(v).replace(/"/g, '&quot;')})" class="btn-danger">Anular</button>` : ''}
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    },
    
    filtrar() {
        const dataInicio = new Date(document.getElementById('filtroDataInicio').value);
        const dataFim = new Date(document.getElementById('filtroDataFim').value);
        const tipo = document.getElementById('filtroTipo').value;
        
        dataFim.setHours(23, 59, 59);
        
        const filtradas = this.vendas.filter(v => {
            const dataVenda = new Date(v.data);
            const matchData = dataVenda >= dataInicio && dataVenda <= dataFim;
            const matchTipo = !tipo || 
                (tipo === 'anulado' ? v.anulado : v.tipoDocumento === tipo);
            
            return matchData && matchTipo;
        });
        
        this.renderizar(filtradas);
    },
    
    verDetalhes(vendaId) {
        const venda = this.vendas.find(v => v.id === vendaId);
        if (venda) {
            vendas.mostrarRecibo(venda, vendaId);
        }
    }
};
