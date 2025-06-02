// storageManager.js - Gerenciador de todos os tipos de armazenamento

class StorageManager {
    constructor() {
        this.isGoogleDriveReady = false;
        this.isFirebaseReady = false;
        this.googleDriveFileId = null;
        this.database = null;
    }

    // Salvar dados em todos os storages disponíveis
    async save(data) {
        console.log('💾 Iniciando salvamento...');
        
        const results = {
            googleDrive: false,
            firebase: false,
            localStorage: false
        };

        // 1. Tentar Google Drive primeiro
        if (this.isGoogleDriveReady) {
            try {
                results.googleDrive = await this.saveToGoogleDrive(data);
            } catch (error) {
                console.error('❌ Erro Google Drive:', error);
            }
        }

        // 2. Backup no Firebase
        if (this.isFirebaseReady) {
            try {
                results.firebase = await this.saveToFirebase(data);
            } catch (error) {
                console.error('❌ Erro Firebase:', error);
            }
        }

        // 3. Backup local (sempre tentar)
        try {
            results.localStorage = this.saveToLocalStorage(data);
        } catch (error) {
            console.error('❌ Erro localStorage:', error);
        }

        // Mostrar resultado
        const successful = Object.values(results).some(result => result);
        if (successful) {
            this.showSaveConfirmation(results);
        }

        return results;
    }

    // Carregar dados do melhor storage disponível
    async load() {
        console.log('📂 Iniciando carregamento...');

        // Tentar Google Drive primeiro
        if (this.isGoogleDriveReady) {
            const data = await this.loadFromGoogleDrive();
            if (data) return data;
        }

        // Tentar Firebase
        if (this.isFirebaseReady) {
            const data = await this.loadFromFirebase();
            if (data) return data;
        }

        // Por último, localStorage
        return this.loadFromLocalStorage();
    }

    // localStorage
    saveToLocalStorage(data) {
        const keys = [
            'visitasPastoraisCarlos',
            'visitasPastoraisCarlosBackup',
            'visitasPastorais_backup'
        ];

        const dataString = JSON.stringify({
            ...data,
            lastUpdate: new Date().getTime(),
            version: '4.0'
        });

        let saved = false;
        
        keys.forEach(key => {
            try {
                localStorage.setItem(key, dataString);
                saved = true;
            } catch (e) {
                console.warn(`Falha ${key}:`, e);
            }
        });

        try {
            sessionStorage.setItem('visitasPastoraisCarlos_session', dataString);
            saved = true;
        } catch (e) {
            console.warn('Falha sessionStorage:', e);
        }

        if (saved) {
            console.log('✅ Salvo localmente!');
        }
        return saved;
    }

    loadFromLocalStorage() {
        const keys = [
            'visitasPastoraisCarlos',
            'visitasPastoraisCarlosBackup',
            'visitasPastorais_backup'
        ];

        for (let key of keys) {
            try {
                const data = localStorage.getItem(key);
                if (data && data !== 'null') {
                    console.log(`✅ Carregado de: ${key}`);
                    return JSON.parse(data);
                }
            } catch (e) {
                console.warn(`Erro ${key}:`, e);
            }
        }

        try {
            const sessionData = sessionStorage.getItem('visitasPastoraisCarlos_session');
            if (sessionData && sessionData !== 'null') {
                console.log('✅ Carregado da sessão');
                return JSON.parse(sessionData);
            }
        } catch (e) {
            console.warn('Erro sessionStorage:', e);
        }

        return null;
    }

    // Firebase
    async saveToFirebase(data) {
        if (!this.isFirebaseReady || !this.database) return false;

        try {
            await this.database.ref('visitasPastoraisCarlos').set({
                ...data,
                lastUpdate: firebase.database.ServerValue.TIMESTAMP
            });
            console.log('✅ Salvo no Firebase!');
            return true;
        } catch (error) {
            console.error('❌ Erro Firebase:', error);
            return false;
        }
    }

    async loadFromFirebase() {
        if (!this.isFirebaseReady || !this.database) return null;

        try {
            const snapshot = await this.database.ref('visitasPastoraisCarlos').once('value');
            const data = snapshot.val();
            if (data) {
                console.log('✅ Carregado do Firebase!');
                return data;
            }
            return null;
        } catch (error) {
            console.error('❌ Erro ao carregar Firebase:', error);
            return null;
        }
    }

    // Google Drive (básico - requer configuração)
    async saveToGoogleDrive(data) {
        console.log('📁 Google Drive não configurado ainda');
        return false;
    }

    async loadFromGoogleDrive() {
        console.log('📁 Google Drive não configurado ainda');
        return null;
    }

    // Mostrar confirmação visual
    showSaveConfirmation(results) {
        let message = '✅ Dados salvos!';
        
        if (results.googleDrive) message = '📁 Salvo no Google Drive!';
        else if (results.firebase) message = '🔥 Salvo no Firebase!';
        else if (results.localStorage) message = '💾 Salvo localmente!';

        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            z-index: 9999;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }

    // Inicializar Firebase
    initFirebase() {
        try {
            if (typeof firebase === 'undefined') return false;

            if (!firebase.apps.length) {
                firebase.initializeApp({
                    apiKey: "AIzaSyBqZK_vE4_0W-LsYyWEEYVy9rGF6tI-JeI",
                    authDomain: "visitas-pastorais-carlos.firebaseapp.com",
                    databaseURL: "https://visitas-pastorais-carlos-default-rtdb.firebaseio.com",
                    projectId: "visitas-pastorais-carlos",
                    storageBucket: "visitas-pastorais-carlos.appspot.com",
                    messagingSenderId: "123456789",
                    appId: "1:123456789:web:abcdef123456789"
                });
            }

            this.database = firebase.database();
            this.isFirebaseReady = true;
            console.log('🔥 Firebase inicializado!');
            return true;
        } catch (error) {
            console.error('❌ Erro Firebase:', error);
            return false;
        }
    }
}

// Disponibilizar globalmente
window.StorageManager = StorageManager;
