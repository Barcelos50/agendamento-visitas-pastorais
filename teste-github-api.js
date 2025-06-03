// Teste básico da API do GitHub
console.log('🧪 Iniciando teste da API do GitHub...');

// Configurações simplificadas
const TESTE_CONFIG = {
    token: 'ghp_GN34xxPFrv7yTNVWs8tSFbjsevAQ7i0RSQt0',
    usuario: 'Barcelos50',
    repo: 'agendamento-visitas-pastorais',
    arquivo: 'dados-pastorais.json'
};

// URL da API
const apiUrl = `https://api.github.com/repos/${TESTE_CONFIG.usuario}/${TESTE_CONFIG.repo}/contents/${TESTE_CONFIG.arquivo}`;

console.log('📡 URL da API:', apiUrl);

// Teste simples
async function testarGitHubAPI() {
    try {
        console.log('🔄 Fazendo requisição para GitHub API...');
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `token ${TESTE_CONFIG.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'AgendamentoPastoral/1.0'
            }
        });

        console.log('📊 Status da resposta:', response.status, response.statusText);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ SUCESSO! API funcionando');
            console.log('📁 Arquivo encontrado:', data.name);
            console.log('📏 Tamanho:', data.size, 'bytes');
            return true;
        } else {
            const errorText = await response.text();
            console.error('❌ ERRO na API:', response.status, errorText);
            return false;
        }
        
    } catch (error) {
        console.error('❌ ERRO na requisição:', error);
        return false;
    }
}

// Executar teste quando a página carregar
window.addEventListener('load', () => {
    setTimeout(() => {
        testarGitHubAPI();
    }, 2000);
});

// Função global para testar manualmente
window.testarAPI = testarGitHubAPI;
