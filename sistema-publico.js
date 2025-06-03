/**
 * Sistema de Armazenamento para Agendamento de Visitas Pastorais
 * Versão para repositório público (sem token)
 */

console.log('🚀 Iniciando sistema pastoral (versão pública)...');

class PastoralPublico {
    constructor() {
        this.baseUrl = 'https://api.github.com/repos/Barcelos50/agendamento-visitas-pastorais/contents/dados-pastorais.json';
        this.inicializado = false;
        this.fileSha = null;
        this.init();
    }

    async init() {
        try {
            console.log('📂 Carregando dados do repositório público...');
            await this.carregarDados();
            this.inicializado = true;
            console.log('✅ Sistema público inicializado com sucesso!');
            this.notificarAtualizacao();
        } catch (error) {
            console.error('❌ Erro ao inicializar:', error);
            this.criarDadosIniciais();
        }
    }

    async carregarDados() {
        const response = await fetch(this.baseUrl, {
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const fileData = await response.json();
        this.fileSha = fileData.sha;
        
        // Decodifica o conteúdo
        const content = atob(fileData.content);
        const dados = JSON.parse(content);
        
        // Atualiza dados globais
        window.DADOS_PASTORAIS = {
            carregado: true,
            agendamentos: dados.agendamentos || [],
            horariosLivres: dados.horariosLivres || {},
            ultimaAtualizacao: new Date(dados.ultimaAtualizacao),
            fileSha: this.fileSha
        };
        
        console.log('✅ Dados carregados:', dados);
        return dados;
    }

    criarDadosIniciais() {
        console.log('📝 Criando dados iniciais locais...');
        
        window.DADOS_PASTORAIS = {
            carregado: true,
            agendamentos: [],
            horariosLivres: this.gerarHorariosIniciais(),
            ultimaAtualizacao: new Date(),
            fileSha: null
        };
        
        this.inicializado = true;
        this.notificarAtualizacao();
    }

    gerarHorariosIniciais() {
        const horarios = {};
        const hoje = new Date();
        const horariosTrabalho = ['09:00', '10:00', '14:00', '15:00', '16:00', '17:00'];
        
        for (let i = 1; i <= 30; i++) {
            const data = new Date(hoje);
            data.setDate(hoje.getDate() + i);
            
            // Pula domingos
            if (data.getDay() === 0) continue;
            
            const dataStr = data.toISOString().split('T')[0];
            horarios[dataStr] = [...horariosTrabalho];
        }
        
        return horarios;
    }

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

            console.log('✅ Agendamento criado (local):', novoAgendamento);
            this.notificarAtualizacao();
            
            // Tenta salvar no GitHub (pode falhar, mas app continua funcionando)
            try {
                await this.salvarNoGitHub();
            } catch (saveError) {
                console.warn('⚠️ Não foi possível salvar no GitHub, mas agendamento foi criado localmente');
            }

            return true;

        } catch (error) {
            console.error('❌ Erro ao adicionar agendamento:', error);
            return false;
        }
    }

    async salvarNoGitHub() {
        // Função opcional para tentar salvar no GitHub
        // Por enquanto, vamos manter apenas local
        console.log('💾 Dados mantidos localmente (sincronização manual necessária)');
    }

    async recarregar() {
        try {
            await this.carregarDados();
            console.log('🔄 Dados recarregados do GitHub');
            this.notificarAtualizacao();
        } catch (error) {
            console.warn('⚠️ Erro ao recarregar, mantendo dados locais');
        }
    }

    notificarAtualizacao() {
        window.dispatchEvent(new CustomEvent('dadosPastoraisAtualizados', {
            detail: {
                agendamentos: window.DADOS_PASTORAIS.agendamentos,
                horariosLivres: window.DADOS_PASTORAIS.horariosLivres,
                carregado: window.DADOS_PASTORAIS.carregado
            }
        }));
    }

    obterHorariosLivres(data) {
        return window.DADOS_PASTORAIS?.horariosLivres?.[data] || [];
    }

    obterAgendamentos() {
        return window.DADOS_PASTORAIS?.agendamentos || [];
    }

    obterAgendamentosPorData(data) {
        return this.obterAgendamentos().filter(a => a.data === data);
    }
}

// Inicializar dados globais
window.DADOS_PASTORAIS = {
    carregado: false,
    agendamentos: [],
    horariosLivres: {},
    ultimaAtualizacao: null
};

// Inicializa quando a página carrega
window.addEventListener('load', () => {
    setTimeout(() => {
        window.pastoralStorage = new PastoralPublico();
        console.log('🌟 Sistema pastoral público iniciado');
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

// Auto-sync a cada 60 segundos
setInterval(() => {
    if (window.pastoralStorage && window.pastoralStorage.inicializado) {
        window.pastoralStorage.recarregar();
    }
}, 60000);
