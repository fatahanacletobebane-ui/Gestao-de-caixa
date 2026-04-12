const relatorios = {
    init() {
        // Configurar datas padrão
        const hoje = new Date();
        document.getElementById('relatorioDataInicio').valueAsDate = hoje;
        document.getElementById('relatorioDataFim').valueAsDate = hoje;
    },
    
    changePeriodo() {
        const periodo = document.getElementById('relatorioPeriodo').value;
        const inicio = document.getElementById('relatorioDataInicio');
        const fim = document.getElementById('relatorioDataFim');
        
        if (periodo === 'custom') {
            inicio.classList.remove('hidden');
            fim.classList.remove('hidden');
        } else {
            inicio.classList.add('hidden');
            fim.classList.add('hidden');
            
            const hoje = new Date();
            fim.valueAsDate = hoje;
            
            switch(periodo) {
                case 'diario':
                    inicio.valueAsDate = hoje;
                    break;
                case 'semanal':
                    const semanaAtras = new Date(hoje - 7 * 24 * 60 * 60 * 1000);
                    inicio.valueAsDate = semanaAtras;
                    break;
                case 'mensal':
                    inicio.valueAsDate = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                    break;
                case 'trimestral':
                    const trimestre = Math.floor(hoje.getMonth() / 3);
                    inicio.valueAsDate = new Date(hoje.getFullYear(), trimestre * 3, 1);
                    break;
                case 'anual':
                    inicio.valueAsDate = new Date(hoje.getFullYear(), 0, 1);
                    break;
            }
        }
    },
    
    async gerarRelatorio() {
        const userData = auth.getUserData();
        if (!userData) return;
        
        // Obter período
        const dataInicio = new Date(document.getElementById('relatorioDataInicio').value);
        const dataFim = new Date(document.getElementById('relatorioDataFim').value);
        dataFim.setHours(23, 59, 59, 999);
        
        // Obter lojas selecionadas
        const lojasSelecionadas = Array.from(
            document.querySelectorAll('#lojasCheckboxes input:checked')
        ).map(cb => cb.value);
        
        if (lojasSelecionadas.length === 0) {
            alert('Selecione pelo menos uma loja!');
            return;
        }
        
        // Buscar vendas
        const snapshot = await dbRefs.contas.child(userData.key).child('sales').once('value');
        const vendas = [];
        
        snapshot.forEach(child => {
            const v = child.val();
            const dataVenda = new Date(v.data);
            
            if (dataVenda >= dataInicio && dataVenda <= dataFim &&
                lojasSelecionadas.includes(v.loja)) {
                vendas.push({ id: child.key, ...v });
            }
        });
        
        // Ordenar por número sequencial
        vendas.sort((a, b) => parseInt(a.numeroSequencial) - parseInt(b.numeroSequencial));
        
        this.renderizarRelatorioA4(vendas, userData, dataInicio, dataFim, lojasSelecionadas);
    },
    
    renderizarRelatorioA4(vendas, userData, dataInicio, dataFim, lojas) {
        const container = document.getElementById('relatorioPreview');
        
        // Calcular totais
        const totais = vendas.reduce((acc, v) => {
            if (!v.anulado) {
                acc.subtotal += v.subtotal;
                acc.iva += v.iva;
                acc.total += v.total;
                acc.documentos++;
            } else {
                acc.anulados++;
            }
            return acc;
        }, { subtotal: 0, iva: 0, total: 0, documentos: 0, anulados: 0 });
        
        const periodoStr = `${dataInicio.toLocaleDateString('pt-PT')} a ${dataFim.toLocaleDateString('pt-PT')}`;
        
        let html = `
            <div class="relatorio-a4">
                <div class="relatorio-header">
                    <h1>Relatório de Vendas - Autoridade Tributária</h1>
                    <div class="subtitulo">Resolução nº 27/2011 de 22 de Junho</div>
                    <div style="margin-top: 15px; font-size: 11pt;">
                        <strong>${userData['Nome da empresa']}</strong><br>
                        NUIT: ${userData['Nuit']} | Contacto: ${userData['Contacto']}<br>
                        ${userData['Endereço']}
                    </div>
                </div>
                
                <div class="relatorio-info">
                    <div>
                        <strong>Período:</strong> ${periodoStr}<br>
                        <strong>Gerado em:</strong> ${new Date().toLocaleString('pt-PT')}
                    </div>
                    <div>
                        <strong>Lojas incluídas:</strong> ${lojas.map(l => lojas.getNomeLoja(l)).join(', ')}<br>
                        <strong>Total de documentos:</strong> ${vendas.length}
                    </div>
                </div>
                
                <div class="relatorio-section">
                    <h3>Resumo Financeiro</h3>
                    <div class="relatorio-resumo">
                        <div class="resumo-box">
                            <h4>Total de Vendas</h4>
                            <div class="valor">${utils.formatMoney(totais.total)}</div>
                        </div>
                        <div class="resumo-box">
                            <h4>IVA (17%)</h4>
                            <div class="valor">${utils.formatMoney(totais.iva)}</div>
                        </div>
                        <div class="resumo-box">
                            <h4>Documentos Emitidos</h4>
                            <div class="valor">${totais.documentos}</div>
                        </div>
                    </div>
                </div>
                
                <div class="relatorio-section">
                    <h3>Detalhamento de Documentos</h3>
                    <table class="relatorio-table">
                        <thead>
                            <tr>
                                <th>Nº Seq.</th>
                                <th>Tipo</th>
                                <th>Data</th>
                                <th>Cliente</th>
                                <th>Subtotal</th>
                                <th>IVA</th>
                                <th>Total</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        vendas.forEach(v => {
            const estado = v.anulado ? 'ANULADO' : 'VÁLIDO';
            const style = v.anulado ? 'style="text-decoration: line-through; color: #999;"' : '';
            
            html += `
                <tr ${style}>
                    <td class="num">${v.numeroSequencial}</td>
                    <td>${v.tipoDocumento.replace('_', '-').toUpperCase()}</td>
                    <td>${v.dataFormatada}</td>
                    <td>${v.cliente.nome}</td>
                    <td class="valor">${utils.formatMoney(v.subtotal)}</td>
                    <td class="valor">${utils.formatMoney(v.iva)}</td>
                    <td class="valor">${utils.formatMoney(v.total)}</td>
                    <td>${estado}</td>
                </tr>
            `;
        });
        
        html += `
                        </tbody>
                        <tfoot>
                            <tr style="font-weight: bold; background: #e0e0e0;">
                                <td colspan="4">TOTAIS</td>
                                <td class="valor">${utils.formatMoney(totais.subtotal)}</td>
                                <td class="valor">${utils.formatMoney(totais.iva)}</td>
                                <td class="valor">${utils.formatMoney(totais.total)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                <div class="relatorio-section">
                    <h3>Documentos Anulados no Período</h3>
                    <p>Total de anulações: <strong>${totais.anulados}</strong></p>
                    ${totais.anulados > 0 ? '<p style="font-size: 10pt; color: #666;">Ver registro detalhado na secção de anulações.</p>' : ''}
                </div>
                
                <div class="relatorio-assinatura">
                    <div class="assinatura-box">
                        <div class="assinatura-line">
                            <strong>O Contribuinte</strong><br>
                            ${userData['Nome']}<br>
                            Data: ___________
                        </div>
                    </div>
                    <div class="assinatura-box">
                        <div class="assinatura-line">
                            <strong>Validação Tributária</strong><br>
                            Carimbo e Assinatura<br>
                            Data: ___________
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 30px; font-size: 9pt; text-align: center; color: #666; border-top: 1px solid #ccc; padding-top: 15px;">
                    Documento gerado automaticamente pelo sistema Moz Vendas Pro<br>
                    Hash de integridade: ${this.gerarHashRelatorio(vendas)}<br>
                    Página 1 de 1
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        container.classList.remove('hidden');
        
        // Auto-scroll para o relatório
        container.scrollIntoView({ behavior: 'smooth' });
    },
    
    gerarHashRelatorio(vendas) {
        const str = vendas.map(v => v.numeroSequencial).join('-') + Date.now();
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).toUpperCase().substr(0, 8);
    }
};
