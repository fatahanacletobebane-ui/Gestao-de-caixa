const auth = {
    usuario: null,
    userKey: null,
    
    login() {
        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const senha = document.getElementById('loginSenha').value;
        const erro = document.getElementById('loginError');
        
        if(!email || !senha) {
            erro.textContent = 'Preencha email e senha';
            return;
        }
        
        // Buscar no Realtime Database
        db.contas.once('value').then(snapshot => {
            let encontrado = null;
            let key = null;
            
            snapshot.forEach(child => {
                const dados = child.val();
                // Verifica email E senha
                if(dados['E-mail']?.toLowerCase() === email && dados['Senha'] === senha) {
                    encontrado = dados;
                    key = child.key;
                }
            });
            
            if(encontrado && encontrado['activação Pro'] === 'On') {
                this.usuario = encontrado;
                this.userKey = key;
                this.entrar();
            } else {
                erro.textContent = 'Dados inválidos ou conta não ativada';
            }
        }).catch(e => {
            erro.textContent = 'Erro de conexão';
            console.error(e);
        });
    },
    
    entrar() {
        // Esconder login, mostrar dashboard
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        
        // Mostrar dados da empresa
        document.getElementById('nomeEmpresa').textContent = this.usuario['Nome da empresa'];
        document.getElementById('nuitDisplay').textContent = 'NUIT: ' + this.usuario['Nuit'];
        
        // Inicializar sistema
        app.iniciar();
    },
    
    logout() {
        this.usuario = null;
        this.userKey = null;
        location.reload();
    },
    
    getUser() {
        return { dados: this.usuario, key: this.userKey };
    }
};
