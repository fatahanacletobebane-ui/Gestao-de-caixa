const vendas = {
    carrinho: [],
    numeroSequencia: null,
    
    init() {
        this.carrinho = [];
        this.renderizarCarrinho();
    },
    
    adicionarAoCarrinho(produto) {
        // Verificar stock
        if (produto.quantidade <= 0) {
            alert('Produto sem stock!');
            return;
        }
        
        const existente = this.carrinho.find(item => item.id === produto.id);
        
        if (existente) {
            if (existente.quantidade >= produto.quantidade) {
                alert('Stock insuficiente!');
                return;
            }
            existente.quantidade++;
        } else {
            this.carrinho.push({
                id: produto.id,
                nome: produto.nome,
                preco: parseFloat(produto.preco),
                quantidade: 1,
                stockDisponivel: produto.quantidade
            });
        }
        
        this.renderizarCarrinho();
    },
    
    removerDoCarrinho(index) {
        this.carrinho.splice(index, 1);
        this.renderizarCarrinho();
    },
    
    alterarQuantidade(index, delta) {
        const item = this.carrinho[index];
        const novaQtd = item.quantidade + delta;
        
        if (novaQtd <= 0) {
            this.removerDoCarrinho(index);
            return;
        }
        
        if (novaQtd > item.stockDisponivel) {
            alert('Stock insuficiente!');
            return;
        }
        
        item.quantidade = novaQtd;
        this.renderizarCarrinho();
    },
    
    renderizarCarrinho() {
        const container = document.getElementById('carrinhoItems');
        
        if (this.carrinho.length === 0) {
            container.innerHTML = '<p class="empty">Nenhum item adicionado</p>';
            this.atualizarTotais(0, 0, 0);
            return;
        }
        
        let html = '';
        let subtotal = 0;
        
        this.carrinho.forEach((item, index) => {
            const total = item.preco * item.quantidade;
            subtotal += total;
            
            html += `
                <div class="carrinho-item">
                    <div class="carrinho-item-info">
                        <h4>${item.nome}</h4>
                        <span>${utils.formatMoney(item.preco)} / un</span>
                    </div>
                    <div class="carrinho-item-qtd">
                        <button onclick="vendas.alterarQuantidade(${index}, -1)">-</button>
                        <span>${item.quantidade}</span>
                        <button onclick="vendas.alterarQuantidade(${index}, 1)">+</button>
                    </div>
                    <div class="carrinho-item-total">${utils.formatMoney(total)}</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Calcular impostos
        const iva = subtotal * 0.17; // 17% IVA Moçambique
        const total = subtotal + iva;
        
        this.atualizarTotais(subtotal, iva, total);
    },
    
    atualizarTotais(subtotal, iva, total) {
        document.getElementById('subtotal').textContent = utils.formatMoney(subtotal);
        document.getElementById('iva').textContent = utils.formatMoney(iva);
        document.getElementById('total').textContent = utils.formatMoney(total);
    },
    
    // ============================
    // EMISSÃO COM SEQUÊNCIA FISCAL
    // ============================
    
    async finalizarVenda() {
        if (this.carrinho.length === 0) {
            alert('Carrinho vazio!');
            return;
        }
        
        const userData = auth.getUserData();
        if (!userData) return;
        
        const tipoDoc = document.getElementById('tipoDocumento').value;
        const nomeCliente = document.getElementById('nomeCliente').value || 'Consumidor Final';
        const nuitCliente = document.getElementById('nuitCliente').value || 'N/A';
        
        try {
            // OBTER NÚMERO SEQUENCIAL ÚNICO - CRÍTICO PARA FINANÇAS
            const numeroRecibo = await this.obterNumeroSequencial(userData.key, tipoDoc);
            
            const agora = Date.now();
            const venda = {
                numeroSequencial: numeroRecibo, // EX: 00001, 00002 (NUNCA REPETE OU SALTA)
                tipoDocumento: tipoDoc,
                loja: lojas.getLojaAtual(),
                data: agora,
                dataFormatada: utils.formatDateTime(agora),
                cliente: {
                    nome: nomeCliente,
                    nuit: nuitCliente
                },
                vendedor: {
                    nome: userData['Nome'],
                    email: userData['E-mail']
                },
                empresa: {
                    nome: userData['Nome da empresa'],
                    nuit: userData['Nuit'],
                    endereco: userData['Endereço'],
                    contacto: userData['Contacto']
                },
                itens: this.carrinho.map(item => ({
                    produto: item.nome,
                    quantidade: item.quantidade,
                    precoUnitario: item.preco,
                    total: item.preco * item.quantidade
                })),
                subtotal: this.carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0),
                iva: 0,
                total: 0,
                status: 'ativo',
                anulado: false,
                dataAnulacao: null,
                motivoAnulacao: null,
                hashValidacao: this.gerarHash(numeroRecibo, agora) // Para auditoria
            };
            
            // Calcular IVA (17%)
            venda.iva = venda.subtotal * 0.17;
            venda.total = venda.subtotal + venda.iva;
            
            // Salvar no Firebase
            const vendaRef = dbRefs.contas.child(userData.key).child('sales').push();
            await vendaRef.set(venda);
            
            // Atualizar stock
            await this.atualizarStock(userData.key);
            
            // Atualizar contador
            await this.incrementarContador(userData.key);
            
            // Mostrar recibo
            this.mostrarRecibo(venda, vendaRef.key);
            
            // Limpar carrinho
            this.carrinho = [];
            this.renderizarCarrinho();
            document.getElementById('nomeCliente').value = '';
            document.getElementById('nuitCliente').value = '';
            
        } catch (error) {
            console.error('Erro ao finalizar venda:', error);
            alert('Erro ao emitir documento. Tente novamente.');
        }
    },
    
    // SISTEMA CRÍTICO: SEQUÊNCIA NUMÉRICA INQUEBRÁVEL
    async obterNumeroSequencial(userKey, tipoDoc) {
        const sequenciaRef = dbRefs.contas.child(userKey).child('sequencias').child(tipoDoc);
        
        // Usar transação para garantir número único mesmo com concorrência
        const resultado = await sequenciaRef.transaction((atual) => {
            if (atual === null) return 1;
            return atual + 1;
        });
        
        const numero = resultado.snapshot.val();
        
        // Formatar: 00001, 00002, etc (5 dígitos)
        return utils.padNumber(numero, 5);
    },
    
    async incrementarContador(userKey) {
        const ref = dbRefs.contas.child(userKey).child('vendasContador');
        await ref.transaction((atual) => (atual || 0) + 1);
    },
    
    gerarHash(numero, timestamp) {
        // Hash simples para validação de integridade
        const str = `${numero}-${timestamp}-${Math.random()}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).toUpperCase();
    },
    
    async atualizarStock(userKey) {
        const tipoLoja = lojas.getLojaAtual();
        const updates = {};
        
        this.carrinho.forEach(item => {
            const ref = dbRefs.contas.child(userKey).child('products').child(tipoLoja).child(item.id);
            updates[`${ref.path}/quantidade`] = firebase.database.ServerValue.increment(-item.quantidade);
            
            // Log de stock
            const logRef = dbRefs.contas.child(userKey).child('stockLogs').push();
            updates[`${logRef.path}`] = {
                produto: item.nome,
                quantidade: -item.quantidade,
                tipo: 'venda',
                data: Date.now()
            };
        });
        
        await database.ref().update(updates);
    },
    
    // ============================
    // VISUALIZAÇÃO DO RECIBO
    // ============================
    
    mostrarRecibo(venda, vendaId) {
        const modal = document.getElementById('modalRecibo');
        const conteudo = document.getElementById('reciboConteudo');
        
        const tipoDocUpper = venda.tipoDocumento.replace('_', '-').toUpperCase();
        
        let html = `
            <div class="recibo-fiscal">
                <div class="recibo-header">
                    <div class="empresa">${venda.empresa.nome}</div>
                    <div class="nuit">NUIT: ${venda.empresa.nuit}</div>
                    <div>${venda.empresa.endereco}</div>
                    <div>Tel: ${venda.empresa.contacto}</div>
                </div>
                
                <div class="recibo-tipo">${tipoDocUpper}</div>
                
                <div class="recibo-info">
                    <div>
                        <strong>Nº Documento:</strong>
                        <span>${venda.numeroSequencial}</span>
                    </div>
                    <div>
                        <strong>Data:</strong>
                        <span>${venda.dataFormatada}</span>
                    </div>
                    <div>
                        <strong>Cliente:</strong>
                        <span>${venda.cliente.nome}</span>
                    </div>
                    <div>
                        <strong>NUIT Cliente:</strong>
                        <span>${venda.cliente.nuit}</span>
                    </div>
                </div>
                
                <table class="recibo-items">
                    <thead>
                        <tr>
                            <th class="num">Nº</th>
                            <th>Descrição</th>
                            <th class="qtd">Qtd</th>
                            <th class="preco">Preço Unit.</th>
                            <th class="total">Total</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        venda.itens.forEach((item, idx) => {
            html += `
                <tr>
                    <td class="num">${idx + 1}</td>
                    <td>${item.produto}</td>
                    <td class="qtd">${item.quantidade}</td>
                    <td class="preco">${utils.formatMoney(item.precoUnitario)}</td>
                    <td class="total">${utils.formatMoney(item.total)}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
                
                <div class="recibo-totais">
                    <div class="line">
                        <span>Subtotal:</span>
                        <span>${utils.formatMoney(venda.subtotal)}</span>
                    </div>
                    <div class="line">
                        <span>IVA (17%):</span>
                        <span>${utils.formatMoney(venda.iva)}</span>
                    </div>
                    <div class="line total">
                        <span>TOTAL:</span>
                        <span>${utils.formatMoney(venda.total)}</span>
                    </div>
                </div>
                
                <div class="recibo-footer">
                    <p>Documento processado por computador</p>
                    <p>Hash: ${venda.hashValidacao}</p>
                    <p>Este documento não serve de factura se não contiver o selo e assinatura</p>
                    <p style="margin-top: 10px; font-size: 9px;">
                        Resolução nº 27/2011 de 22 de Junho - Sistema de Facturação de Moçambique
                    </p>
                </div>
            </div>
        `;
        
        conteudo.innerHTML = html;
        conteudo.dataset.vendaId = vendaId;
        conteudo.dataset.vendaData = JSON.stringify(venda);
        
        modal.classList.remove('hidden');
    },
    
    imprimirRecibo() {
        window.print();
    },
    
    downloadPDF() {
        // Implementar geração de PDF se necessário
        alert('Funcionalidade PDF - usar biblioteca jsPDF ou similar');
    },
    
    fecharModal() {
        document.getElementById('modalRecibo').classList.add('hidden');
    }
};
