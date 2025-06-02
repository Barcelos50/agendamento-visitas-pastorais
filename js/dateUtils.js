// dateUtils.js - Funções para manipulação de datas
// Arquivo separado para evitar bugs de fuso horário

class DateUtils {
    
    // Criar data limpa sem problemas de fuso horário
    static createCleanDate(year, month, day) {
        const date = new Date(year, month, day, 12, 0, 0, 0);
        return date;
    }
    
    // Formatar data para chave (YYYY-MM-DD)
    static formatDateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const key = `${year}-${month}-${day}`;
        
        console.log(`🗓️ formatDateKey: ${date.toString()} -> ${key}`);
        return key;
    }
    
    // Formatar data para exibição (DD/MM/YYYY)
    static formatDateDisplay(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const display = `${day}/${month}/${year}`;
        
        console.log(`📅 formatDateDisplay: ${date.toString()} -> ${display}`);
        return display;
    }
    
    // Converter chave de data de volta para objeto Date
    static parseDateKey(dateKey) {
        const [year, month, day] = dateKey.split('-').map(Number);
        const date = new Date(year, month - 1, day, 12, 0, 0, 0);
        
        console.log(`🔄 parseDateKey: ${dateKey} -> ${date.toString()}`);
        return date;
    }
    
    // Verificar se duas datas são o mesmo dia
    static isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
    
    // Obter data de hoje limpa
    static getToday() {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
    }
    
    // Debug completo de uma data
    static debugDate(date, label = 'Data') {
        console.log(`🔍 DEBUG ${label}:`);
        console.log(`   Objeto: ${date.toString()}`);
        console.log(`   Ano: ${date.getFullYear()}`);
        console.log(`   Mês: ${date.getMonth() + 1}`);
        console.log(`   Dia: ${date.getDate()}`);
        console.log(`   Chave: ${this.formatDateKey(date)}`);
        console.log(`   Display: ${this.formatDateDisplay(date)}`);
    }
}

// Disponibilizar globalmente
window.DateUtils = DateUtils;
