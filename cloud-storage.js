/**
 * Sistema de Armazenamento GitHub para Agendamento de Visitas Pastorais
 * Usa o GitHub como banco de dados - Simples e gratuito
 */

class GitHubStorage {
    constructor() {
        this.baseUrl = `https://api.github.com/repos/${CONFIG.GITHUB.USERNAME}/${CONFIG.GITHUB.REPO}/contents/${CONFIG.GITHUB.ARQUIVO_DADOS}`;
        this.fileSha = null; // Para atualizações
        this.isInitialized = false;
        this.init();
    }

    // Inicializa o sistema
    async init() {
        try {
            console.log('🚀 Iniciando sistema GitHub Storage...');
            await this.carregarDados();
            this.isInitialized = true;
            console.log('✅ Sistema inicializado com sucesso');
            
            // Atualiza a interface
            this.atualizarInterface();
            
        } catch (error) {
            console.error('❌ Erro ao inicializar:', error);
            this.criarArquivoInicial();
        }
    }

    // Carrega dados do GitHub
    async carregarDados() {
        try {
            const response = await fetch(this.baseUrl, {
                headers: {
                    'Authorization': `token ${CONFIG.GITHUB.TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const fileData = await response.json();
            this.fileSha = fileData.sha; // Necessário para updates

            // Decodifica o conteúdo base64
            const content = atob(fileData.content);
            const dados = JSON.parse(content);

            // Atualiza estado global
            window.PASTORAL_APP.dadosAtuais = dados;
            window.PASTORAL_APP.ultimaAtualizacao = new Date(dados.configuracoes.ultimaAtualizacao);
            window.PASTORAL_APP.isLoaded = true;

            console.log('✅ Dados carregados do GitHub:', dados);
            return dados;

        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            throw error;
        }
    }

    // Cria arquivo inicial se não existir
    async criarArquivoInicial() {
        try {
            console.log('📝 Criando arquivo inicial...');
            
            const dadosIniciais = {
                configuracoes: {
                    ...CONFIG.APP_CONFIG,
                    ultimaAtualizacao: new Date().toISOString()
                },
                horariosDisponiveis: this.gerarHorariosIniciais(),
                agendamentos: []
            };

            const content = btoa(JSON.stringify(dadosIniciais, null, 2));

            const response = await fetch(this.baseUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${CONFIG.GITHUB.TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Criar arquivo inicial de dados pastorais',
                    content: content,
                    branch: CONFIG.GITHUB.BRANCH
                })
            });

            if (!response.ok) {
                throw new Error(`Erro ao criar arquivo: ${response.status}`);
            }

            const result = await response.json();
            this.fileSha = result.content.sha;

            window.PASTORAL_APP.dadosAtuais = dadosIniciais;
            window.PASTORAL_APP.isLoaded = true;

            console.log('✅ Arquivo inicial criado com sucesso');
            this.atualizarInterface();

        } catch (error) {
            console.error('❌ Erro ao criar arquivo inicial:', error);
        }
    }

    // Gera horários disponíveis para os próximos dias
    gerarHorariosIniciais() {
        const horarios = {};
        const hoje = new Date();
        
        for (let i = 1; i <= CONFIG.APP_CONFIG.diasAntecedencia; i++) {
            const data = new Date(hoje);
            data.setDate(hoje.getDate() + i);
            
            // Pula domingos (dia 0) - ajuste conforme necessário
            if (data.getDay() === 0) continue;
            
            const dataStr = data.toISOString().split('T')[0];
            horarios[dataStr] = [...CONFIG.APP_CONFIG.horariosDisponiveis];
        }
        
        return horarios;
    }

    // Salva dados no GitHub
    async salvarDados(novosDados) {
        try {
            if (!this.fileSha) {
                console.error('❌ SHA do arquivo não encontrado');
                return false;
            }

            // Atualiza timestamp
            novosDados.configuracoes.ultimaAtualizacao = new Date().toISOString();

            const content = btoa(JSON.stringify(novosDados, null, 2));

            const response = await fetch(this.baseUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${CONFIG.GITHUB.TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Atualizar agendamentos pastorais - ${new Date().toLocaleString('pt-BR')}`,
                    content: content,
                    sha: this.fileSha,
                    branch: CONFIG.GITHUB.BRANCH
                })
            });

            if (!response.ok) {
                throw new Error(`Erro ao salvar: ${response.status}`);
            }

            const result = await response.json();
            this.fileSha = result.content.sha; // Atualiza SHA para próxima operação

            // Atualiza estado global
            window.PASTORAL_APP.dadosAtuais = novosDados;
            window.PASTORAL_APP.ultimaAtualizacao = new Date();

            console.log('✅ Dados salvos no GitHub com sucesso');
            this.atualizarInterface();
            return true;

        } catch (error) {
            console.error('❌ Erro ao salvar dados:', error);
            return false;
        }
    }

    // Adiciona novo agendamento
    async adicionarAgendamento(agendamento) {
        try {
            const dados = { ...window.PASTORAL_APP.dadosAtuais };
            
            // Cria o agendamento
            const novoAgendamento = {
                id: Date.now().toString(),
                ...agendamento,
                status: 'agendado',
                criadoEm: new Date().toISOString()
            };

            // Adiciona à lista
            dados.agendamentos.push(novoAgendamento);

            // Remove horário da lista de disponíveis
            const dataAgendamento = agendamento.data;
            if (dados.horariosDisponiveis[dataAgendamento]) {
                dados.horariosDisponiveis[dataAgendamento] = dados.horariosDisponiveis[dataAgendamento]
                    .filter(h => h !== agendamento.horario);
            }

            // Salva no GitHub
            const sucesso = await this.salvarDados(dados);
            
            if (sucesso) {
                // Dispara evento para o app original
                window.dispatchEvent(new CustomEvent('agendamentoCriado', { 
                    detail: novoAgendamento 
                }));
                
                console.log('✅ Agendamento criado:', novoAgendamento);
            }

            return sucesso;

        } catch (error) {
            console.error('❌ Erro ao adicionar agendamento:', error);
            return false;
        }
    }

    // Remove agendamento (para cancelamentos)
    async removerAgendamento(agendamentoId) {
        try {
            const dados = { ...window.PASTORAL_APP.dadosAtuais };
            
            // Encontra o agendamento
            const agendamento = dados.agendamentos.find(a => a.id === agendamentoId);
            if (!agendamento) {
                console.error('❌ Agendamento não encontrado');
                return false;
            }

            // Remove da lista
            dados.agendamentos = dados.agendamentos.filter(a => a.id !== agendamentoId);

            // Recoloca horário na lista de disponíveis
            const dataAgendamento = agendamento.data;
            if (dados.horariosDisponiveis[dataAgendamento]) {
                dados.horariosDisponiveis[dataAgendamento].push(agendamento.horario);
                dados.horariosDisponiveis[dataAgendamento].sort(); // Reordena
            }

            // Salva no GitHub
            const sucesso = await this.salvarDados(dados);
            
            if (sucesso) {
                window.dispatchEvent(new CustomEvent('agendamentoCancelado', { 
                    detail: agendamento 
                }));
                
                console.log('✅ Agendamento cancelado:', agendamento);
            }

            return sucesso;

        } catch (error) {
            console.error('❌ Erro ao remover agendamento:', error);
            return false;
        }
    }

    // Atualiza interface do app original
    atualizarInterface() {
        // Dispara evento para que o app original atualize a tela
        window.dispatchEvent(new CustomEvent('dadosAtualizados', {
            detail: window.PASTORAL_APP.dadosAtuais
        }));
    }

    // Recarrega dados do GitHub (para sincronização)
    async recarregarDados() {
        try {
            await this.carregarDados();
            console.log('🔄 Dados recarregados do GitHub');
        } catch (error) {
            console.error('❌ Erro ao recarregar dados:', error);
        }
    }

    // Obtém horários disponíveis para uma data
    obterHorariosDisponiveis(data) {
        return window.PASTORAL_APP.dadosAtuais.horariosDisponiveis[data] || [];
    }

    // Obtém todos os agendamentos
    obterAgendamentos() {
        return window.PASTORAL_APP.dadosAtuais.agendamentos || [];
    }

    // Obtém agendamentos por data
    obterAgendamentosPorData(data) {
        return this.obterAgendamentos().filter(a => a.data === data);
    }
}

// Inicializa o sistema quando a página carrega
window.addEventListener('load', () => {
    // Pequeno delay para garantir que tudo carregou
    setTimeout(() => {
        window.githubStorage = new GitHubStorage();
        console.log('🚀 Sistema GitHub Storage iniciado');
    }, 500);
});

// Funções globais para o app original usar
window.adicionarAgendamentoPastoral = async function(dadosAgendamento) {
    if (window.githubStorage && window.githubStorage.isInitialized) {
        return await window.githubStorage.adicionarAgendamento(dadosAgendamento);
    }
    console.warn('⚠️ Sistema ainda não inicializado');
    return false;
};

window.obterHorariosDisponiveis = function(data) {
    if (window.githubStorage && window.PASTORAL_APP.isLoaded) {
        return window.githubStorage.obterHorariosDisponiveis(data);
    }
    return [];
};

window.obterAgendamentos = function() {
    if (window.githubStorage && window.PASTORAL_APP.isLoaded) {
        return window.githubStorage.obterAgendamentos();
    }
    return [];
};

window.cancelarAgendamento = async function(agendamentoId) {
    if (window.githubStorage && window.githubStorage.isInitialized) {
        return await window.githubStorage.removerAgendamento(agendamentoId);
    }
    return false;
};

window.recarregarDadosPastorais = async function() {
    if (window.githubStorage) {
        await window.githubStorage.recarregarDados();
    }
};

// Auto-recarregamento a cada 30 segundos para sincronização
setInterval(() => {
    if (window.githubStorage && window.githubStorage.isInitialized) {
        window.githubStorage.recarregarDados();
    }
}, 30000);
