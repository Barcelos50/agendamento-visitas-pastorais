// Configurações do GitHub API para Agendamento de Visitas Pastorais
const CONFIG = {
    // Configurações do GitHub
    GITHUB: {
        USERNAME: 'Barcelos50', // Seu usuário GitHub
        REPO: 'agendamento-visitas-pastorais', // Nome do repositório
        TOKEN: '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', // Token que você vai gerar
        ARQUIVO_DADOS: 'dados-pastorais.json', // Arquivo que vamos criar
        BRANCH: 'main' // Branch principal
    },
    
    // Configurações do app
    APP_CONFIG: {
        horariosDisponiveis: ['09:00', '10:00', '14:00', '15:00', '16:00', '17:00'],
        diasSemana: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
        intervaloPadrao: 60, // minutos
        diasAntecedencia: 30 // quantos dias à frente liberar agendamentos
    }
};

// Estado global da aplicação
window.PASTORAL_APP = {
    isLoaded: false,
    dadosAtuais: {
        agendamentos: [],
        horariosDisponiveis: {},
        configuracoes: CONFIG.APP_CONFIG
    },
    ultimaAtualizacao: null
};
