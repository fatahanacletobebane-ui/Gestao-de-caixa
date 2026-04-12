const anulacoes = {
    vendaSelecionada: null,
    
    init() {
        // Inicialização se necessário
    },
    
    solicitarAnulacao(vendaId, vendaData) {
        this.vendaSelecionada = { id: vendaId, ...vendaData };
        
        const modal = document.getElementById('modalAnulacao');
        const info = document.getElementById('anulacaoInfo');
        
        info.innerHTML = `
            <strong>Documento:</strong> ${vendaData.tipoDocumento.toUpperCase()} Nº ${vendaData.numeroSequencial}<br>
            <strong>Data:</strong> ${vendaData.dataFormatada}<br>
            <strong>Valor:</strong> ${utils.formatMoney(vendaData.total)}<br>
            <strong>Cliente:</strong> ${vendaData.cliente.nome}
        `;
        
        document.getElementById('motivoAnulacao').value = '';
        modal.classList.remove('hidden');
    },
    
    async confirmarAnulacao() {
        const motivo = document.getElementById('motivoAnulacao').value.trim();
        
        if (!motivo) {
            alert('O motivo da anulação é obrigatório!');
            return;
        }
        
        if (!this.vendaSelecionada) return;
        
        const userData = auth.getUserData();
        if (!userData) return;
        
        try {
            const agora = Date.now();
            
            // 1. Marcar venda como anulada (NÃO APAGAR - apenas marcar)
            const vendaRef = dbRefs.contas.child(userKey).child('sales').child(this.vendaSelecionada.id);
            
            await vendaRef.update({
                status: 'anulado',
                anulado: true,
                dataAnulacao: agora,
                motivoAnulacao: motivo,
                anuladoPor: {
                    nome: userData['Nome'],
                    email: userData['E-mail'],
                    timestamp: agora
                }
            });
            
            // 2. Criar registro de anulação separado (nota de anulação)
            const anulacaoRef = dbRefs.contas.child(userKey).child('anulacoes').push();
            
            await anulacaoRef.set({
                documentoOriginal: {
                    id: this.vendaSelecionada.id,
                    numeroSequencial: this.vendaSelecionada.numeroSequencial,
                    tipoDocumento: this.vendaSelecionada.tipoDocumento,
                    dataOriginal: this.vendaSelecionada.data,
                    valor: this.vendaSelecionada.total
                },
                dataAnulacao: agora,
                dataAnulacaoFormatada: utils.formatDateTime(agora),
                motivo: motivo,
                anuladoPor: {
                    nome: userData['Nome'],
                    email: userData['E-mail']
                },
                cliente: this.vendaSelecionada.cliente
            });
            
            // 3. Restaurar stock se necessário
            await this.restaurarStock(userData.key, this.vendaSelecionada);
            
            alert('Documento anulado com sucesso!\n\nNota: O documento original permanece no histórico marcado como anulado.');
            this.fecharModal();
            
            // Atualizar histórico
            historico.carregarHistorico();
            
        } catch (error) {
            console.error('Erro ao anular:', error);
            alert('Erro ao anular documento.');
        }
    },
    
    async restaurarStock(userKey, venda) {
        const updates = {};
        
        venda.itens.forEach(item => {
            // Assumindo que temos o ID do produto no item
            // Se não tiver, precisa de lógica adicional para encontrar pelo nome
            const logRef = dbRefs.contas.child(userKey).child('stockLogs').push();
            updates[`${logRef.path}`] = {
                produto: item.produto,
                quantidade: item.quantidade,
                tipo: 'anulacao',
                documento: venda.numeroSequencial,
                data: Date.now()
            };
        });
        
        if (Object.keys(updates).length > 0) {
            await database.ref().update(updates);
        }
    },
    
    fecharModal() {
        document.getElementById('modalAnulacao').classList.add('hidden');
        this.vendaSelecionada = null;
    }
};
