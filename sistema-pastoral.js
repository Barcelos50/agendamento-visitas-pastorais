/**
 * Sistema de Armazenamento para Agendamento de Visitas Pastorais
 * Versão corrigida e compatível com config.js atual
 */

class PastoralStorage {
    constructor() {
        this.inicializado = false;
        this.init();
    }

    // Inicializa o sistema
    async init() {
        console.log('🚀 Iniciando sistema de agendamento pastoral...');
        
        try {
            await this.carregarDados();
            this.inicializado = true;
            console.log('✅ Sistema inicializado com sucesso');
            this.notificarAtualizacao();
        } catch (error) {
            console.log('📝 Criando arquivo inicial...');
            await this.criarArquivoInicial();
        }
    }

    // Carrega dados do GitHub
    async carregarDados() {
        const response = await fetch(PASTORAL_CONFIG.API_URL, {
            headers: PASTORAL_CONFIG.AUTH_HEADERS
        });

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const fileData = await response.json();
        
        // Salva SHA para updates
        window.DADOS_PASTORAIS.fileSha = fileData.sha;
        
        // Decodifica e parse do JSON
        const content = atob(fileData.content);
        const dados = JSON.parse(content);
        
        // Atualiza dados globais
        window.DADOS_PASTORAIS.agendamentos = dados.agendamentos || [];
        window.DADOS_PASTORAIS.horariosLivres = dados.horariosLivres || {};
        window.DADOS_PASTORAIS.ultimaAtualizacao = new Date(dados.ultimaAtualizacao);
        window.DADOS_PASTORAIS.carregado = true;
        
        console.log('✅ Dados carregados:', dados);
        return dados;
    }

    // Cria arquivo inicial
    async criarArquivoInicial() {
        const dadosIniciais = {
            agendamentos: [],
            horariosLivres: this.gerarHorariosIniciais(),
            ultimaAtualizacao: new Date().toISOString(),
            versao: '1.0'
        };

        const success = await this.salvarDados(dadosIniciais, 'Criar arquivo inicial de dados pastorais');
        
        if (success) {
            window.DADOS_PASTORAIS.agendamentos = dadosIniciais.agendamentos;
            window.DADOS_PASTORAIS.horariosLivres = dadosIniciais.horariosLivres;
            window.DADOS_PASTORAIS.carregado = true;
            this.inicializado = true;
            console.log('✅ Arquivo inicial criado');
            this.notificarAtualizacao();
        }
    }

    // Gera horários iniciais
    gerarHorariosIniciais() {
        const horarios = {};
        const hoje = new Date();
        
        for (let i = 1; i <= PASTORAL_CONFIG.DIAS_LIBERADOS; i++) {
            const data = new Date(hoje);
            data.setDate(hoje.getDate() + i);
            
            // Pula domingos
            if (data.getDay() === 0) continue;
            
            const dataStr = data.toISOString().split('T')[0];
            horarios[dataStr] = [...PASTORAL_CONFIG.HORARIOS_TRABALHO];
        }
        
        return horarios;
    }

    // Salva dados no GitHub
    async salvarDados(dados, mensagem = 'Atualizar agendamentos pastorais') {
        try {
            dados.ultimaAtualizacao = new Date().toISOString();
            
            const content = btoa(JSON.stringify(dados, null, 2));
            
            const body = {
                message: `${mensagem} - ${new Date().toLocaleString('pt-BR')}`,
                content: content
            };
            
            // Adiciona SHA se for update
            if (window.DADOS_PASTORAIS.fileSha) {
                body.sha = window.DADOS_PASTORAIS.fileSha;
            }

            const response = await fetch(PASTORAL_CONFIG.API_URL, {
                method: 'PUT',
                headers: PASTORAL_CONFIG.AUTH_HEADERS,
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            window.DADOS_PASTORAIS.fileSha = result.content.sha;
            
            console.log('✅ Dados salvos com sucesso');
            return true;

        } catch (error) {
            console.error('❌ Erro ao salvar:', error);
            return false;
        }
    }

    // Adiciona novo agendamento
    async adicionarAgendamento(dadosAgendamento) {
        if (!this.inicializado) {
            console.warn('⚠️ Sistema ainda não inicializado');
            return false;
        }

        try {
            // Cria o agendamento
            const novoAgendamento = {
                id: Date.now().toString(),
                data: dadosAgendamento.data,
                horario: dadosAgendamento.horario,
                nome: dadosAgendamento.nome,
                telefone: dadosAgendamento.telefone,
                endereco: dadosAgendamento.endereco,
                status: 'agendado',
                criadoEm: new Date().toISOString()
            };

            // Atualiza dados locais
            window.DADOS_PASTORAIS.agendamentos.push(novoAgendamento);
            
            // Remove horário da lista de livres
            if (window.DADOS_PASTORAIS.horariosLivres[dadosAgendamento.data]) {
                window.DADOS_PASTORAIS.horariosLivres[dadosAgendamento.data] = 
                    window.DADOS_PASTORAIS.horariosLivres[dadosAgendamento.data]
                        .filter(h => h !== dadosAgendamento.horario);
            }

            // Prepara dados para salvar
            const dadosParaSalvar = {
                agendamentos: window.DADOS_PASTORAIS.agendamentos,
                horariosLivres: window.DADOS_PASTORAIS.horariosLivres,
                versao: '1.0'
            };

            // Salva no GitHub
            const sucesso = await this.salvarDados(dadosParaSalvar, 'Novo agendamento adicionado');
            
            if (sucesso) {
                console.log('✅ Agendamento criado:', novoAgendamento);
                this.notificarAtualizacao();
                
                // Notifica o app principal
                window.dispatchEvent(new CustomEvent('agendamentoCriado', {
                    detail: novoAgendamento
                }));
            }

            return sucesso;

        } catch (error) {
            console.error('❌ Erro ao adicionar agendamento:', error);
            return false;
        }
    }

    // Remove agendamento
    async removerAgendamento(agendamentoId) {
        if (!this.inicializado) return false;

        try {
            const agendamento = window.DADOS_PASTORAIS.agendamentos.find(a => a.id === agendamentoId);
            if (!agendamento) return false;

            // Remove da lista
            window.DADOS_PASTORAIS.agendamentos = window.DADOS_PASTORAIS.agendamentos
                .filter(a => a.id !== agendamentoId);

            // Recoloca horário na lista de livres
            if (!window.DADOS_PASTORAIS.horariosLivres[agendamento.data]) {
                window.DADOS_PASTORAIS.horariosLivres[agendamento.data] = [];
            }
            
            window.DADOS_PASTORAIS.horariosLivres[agendamento.data].push(agendamento.horario);
            window.DADOS_PASTORAIS.horariosLivres[agendamento.data].sort();

            // Salva alterações
            const dadosParaSalvar = {
                agendamentos: window.DADOS_PASTORAIS.agendamentos,
                horariosLivres: window.DADOS_PASTORAIS.horariosLivres,
                versao: '1.0'
            };

            const sucesso = await this.salvarDados(dadosParaSalvar, 'Agendamento cancelado');
            
            if (sucesso) {
                console.log('✅ Agendamento cancelado:', agendamento);
                this.notificarAtualizacao();
            }

            return sucesso;

        } catch (error) {
            console.error('❌ Erro ao remover agendamento:', error);
            return false;
        }
    }

    // Recarrega dados do GitHub
    async recarregar() {
        try {
            await this.carregarDados();
            console.log('🔄 Dados recarregados');
            this.notificarAtualizacao();
        } catch (error) {
            console.error('❌ Erro ao recarregar:', error);
        }
    }

    // Notifica atualização para o app principal
    notificarAtualizacao() {
        window.dispatchEvent(new CustomEvent('dadosPastoraisAtualizados', {
            detail: {
                agendamentos: window.DADOS_PASTORAIS.agendamentos,
                horariosLivres: window.DADOS_PASTORAIS.horariosLivres,
                carregado: window.DADOS_PASTORAIS.carregado
            }
        }));
    }

    // Métodos de consulta
    obterHorariosLivres(data) {
        return window.DADOS_PASTORAIS.horariosLivres[data] || [];
    }

    obterAgendamentos() {
        return window.DADOS_PASTORAIS.agendamentos || [];
    }

    obterAgendamentosPorData(data) {
        return this.obterAgendamentos().filter(a => a.data === data);
    }

    estaCarregado() {
        return window.DADOS_PASTORAIS.carregado;
    }
}

// Inicializa quando a página carrega
window.addEventListener('load', () => {
    setTimeout(() => {
        window.pastoralStorage = new PastoralStorage();
        console.log('🚀 Sistema de agendamento pastoral iniciado');
    }, 1000);
});

// Funções globais para o app usar
window.agendarVisitaPastoral = async function(dados) {
    if (window.pastoralStorage && window.pastoralStorage.inicializado) {
        return await window.pastoralStorage.adicionarAgendamento(dados);
    }
    console.warn('⚠️ Sistema ainda carregando...');
    return false;
};

window.cancelarVisitaPastoral = async function(id) {
    if (window.pastoralStorage && window.pastoralStorage.inicializado) {
        return await window.pastoralStorage.removerAgendamento(id);
    }
    return false;
};

window.obterHorariosDisponiveis = function(data) {
    if (window.pastoralStorage && window.DADOS_PASTORAIS.carregado) {
        return window.pastoralStorage.obterHorariosLivres(data);
    }
    return [];
};

window.obterTodosAgendamentos = function() {
    if (window.pastoralStorage && window.DADOS_PASTORAIS.carregado) {
        return window.pastoralStorage.obterAgendamentos();
    }
    return [];
};

window.recarregarDadosPastorais = async function() {
    if (window.pastoralStorage) {
        await window.pastoralStorage.recarregar();
    }
};

// Auto-sync a cada 30 segundos
setInterval(() => {
    if (window.pastoralStorage && window.pastoralStorage.inicializado) {
        window.pastoralStorage.recarregar();
    }
}, 30000);
