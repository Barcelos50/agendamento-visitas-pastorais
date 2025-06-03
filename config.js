// Configuração do Sistema de Agendamento Pastoral
const PASTORAL_CONFIG = {
    // Suas informações do GitHub
    GITHUB_USERNAME: 'Barcelos50',
    GITHUB_REPO: 'agendamento-visitas-pastorais',
    GITHUB_TOKEN: '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', // Seu token atual
    DADOS_ARQUIVO: 'dados-pastorais.json',
    
    // Configurações da igreja
    HORARIOS_TRABALHO: ['09:00', '10:00', '14:00', '15:00', '16:00', '17:00'],
    DIAS_SEMANA: ['segunda', 'terca', 'quarta', 'quinta', 'sexta'],
    DIAS_LIBERADOS: 30, // quantos dias à frente
    
    // URLs da API do GitHub
    get API_URL() {
        return `https://api.github.com/repos/${this.GITHUB_USERNAME}/${this.GITHUB_REPO}/contents/${this.DADOS_ARQUIVO}`;
    },
    
    get AUTH_HEADERS() {
        return {
            'Authorization': `token ${this.GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
        };
    }
};

// Estado global da aplicação
window.DADOS_PASTORAIS = {
    carregado: false,
    agendamentos: [],
    horariosLivres: {},
    ultimaAtualizacao: null,
    fileSha: null // necessário para atualizações
};
