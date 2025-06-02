// app.js - Aplicação principal modularizada

class VisitasPastoraisApp {
    constructor() {
        // Configurações
        this.PASTOR_PASSWORD = 'Carlos10';
        
        // Instâncias dos managers
        this.storage = new StorageManager();
        
        // Dados da aplicação
        this.availableSlots = {};
        this.bookedVisits = {};
        this.currentMonth = new Date();
        this.pastorCurrentMonth = new Date();
        this.selectedDate = null;
        this.selectedTime = null;
        this.selectedPastorDate = null;
        this.selectedPastorTimes = [];
        this.pastorLoggedIn = false;
        
        // Horários disponíveis
        this.timeSlots = [
            '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
            '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
            '20:00', '20:30', '21:00', '21:30'
        ];
        
        // Meses
        this.months = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        
        this.weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    }

    // Inicializar aplicação
    async init() {
        console.log('🚀 Inicializando Visitas Pastorais App...');
        
        // Carregar dados salvos primeiro
        await this.loadData();
        
        // Renderizar interface
        this.renderMemberCalendar();
        
        // Inicializar APIs de armazenamento
        setTimeout(() => {
            this.storage.initFirebase();
        }, 1000);
        
        // Configurar eventos
        this.setupEventListeners();
        
        console.log('✅ App inicializado!');
    }

    // Carregar dados
    async loadData() {
        const data = await this.storage.load();
        if (data) {
            this.availableSlots = data.availableSlots || {};
            this.bookedVisits = data.bookedVisits || {};
            console.log('📂 Dados carregados:', { 
                horarios: Object.keys(this.availableSlots).length,
                visitas: Object.keys(this.bookedVisits).length 
            });
        }
    }

    // Salvar dados
    async saveData() {
        const data = {
            availableSlots: this.availableSlots,
            bookedVisits: this.bookedVisits
        };
        
        console.log('💾 Salvando dados:', data);
        return await this.storage.save(data);
    }

    // Autenticação do pastor
    checkPassword() {
        const password = document.getElementById('pastor-password').value;
        if (password === this.PASTOR_PASSWORD) {
            this.pastorLoggedIn = true;
            document.getElementById('pastor-login').style.display = 'none';
            document.getElementById('pastor-content').style.display = 'block';
            this.renderPastorCalendar();
            this.renderAllVisits();
        } else {
            alert('Senha incorreta! Tente novamente.');
            document.getElementById('pastor-password').value = '';
        }
    }

    logout() {
        this.pastorLoggedIn = false;
        document.getElementById('pastor-login').style.display = 'block';
        document.getElementById('pastor-content').style.display = 'none';
        document.getElementById('pastor-password').value = '';
    }

    // Agendamento de visita
    async confirmBooking() {
        const name = document.getElementById('member-name').value;
        const phone = document.getElementById('member-phone').value;
        const address = document.getElementById('member-address').value;
        
        if (!name || !phone || !address) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        
        // DEBUG DETALHADO DA DATA
        console.log('=== 🔍 DEBUG COMPLETO DO AGENDAMENTO ===');
        DateUtils.debugDate(this.selectedDate, 'Data Selecionada');
        
        // Usar DateUtils para garantir consistência
        const dateKey = DateUtils.formatDateKey(this.selectedDate);
        console.log(`🗓️ DateKey gerado: ${dateKey}`);
        console.log(`🕐 Horário: ${this.selectedTime}`);
        
        if (!this.bookedVisits[dateKey]) {
            this.bookedVisits[dateKey] = {};
        }
        
        this.bookedVisits[dateKey][this.selectedTime] = {
            name: name,
            phone: phone,
            address: address,
            dataAgendamento: new Date().toLocaleString('pt-BR'),
            // Debug info
            dateKeyOriginal: dateKey,
            selectedDateDebug: this.selectedDate.toString(),
            timestampAgendamento: Date.now()
        };
        
        console.log('📝 Visita salva:', this.bookedVisits[dateKey][this.selectedTime]);
        console.log('========================================');
        
        // Salvar dados
        await this.saveData();
        
        // Fechar modal e mostrar confirmação
        this.closeMemberModal();
        this.showBookingConfirmation();
        
        // Atualizar calendários
        this.renderMemberCalendar();
        if (this.pastorLoggedIn) {
            this.renderAllVisits();
        }
    }

    // Mostrar confirmação de agendamento
    showBookingConfirmation() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white; padding: 30px; border-radius: 15px;
            text-align: center; max-width: 400px; margin: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        `;
        
        // Usar DateUtils para exibição
        const displayDate = DateUtils.formatDateDisplay(this.selectedDate);
        
        content.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 20px;">✅</div>
            <h3 style="color: #28a745; margin-bottom: 15px;">Visita Agendada com Sucesso!</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p style="margin-bottom: 10px;"><strong>📅 Data:</strong> ${displayDate}</p>
                <p style="margin-bottom: 10px;"><strong>🕐 Horário:</strong> ${this.selectedTime}</p>
            </div>
            <p style="color: #666; margin-bottom: 25px;">
                Pr. Carlos Barcelos entrará em contato em breve para confirmar os detalhes da visita.
            </p>
            <button onclick="app.closeBookingModal()" style="
                background: #28a745; color: white; border: none;
                padding: 12px 30px; border-radius: 8px; font-size: 16px;
                cursor: pointer; font-weight: 600;
            ">Entendi</button>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        window.currentBookingModal = modal;
    }

    closeBookingModal() {
        if (window.currentBookingModal) {
            document.body.removeChild(window.currentBookingModal);
            window.currentBookingModal = null;
        }
    }

    // Renderização do calendário dos membros
    renderMemberCalendar() {
        const calendar = document.getElementById('member-calendar');
        const monthText = document.getElementById('current-month');
        
        monthText.textContent = `${this.months[this.currentMonth.getMonth()]} ${this.currentMonth.getFullYear()}`;
        calendar.innerHTML = '';
        
        // Headers
        this.weekDays.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-header';
            dayHeader.textContent = day;
            calendar.appendChild(dayHeader);
        });
        
        // Days
        const firstDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        for (let i = 0; i < 42; i++) {
            const cellDate = new Date(startDate);
            cellDate.setDate(startDate.getDate() + i);
            
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = cellDate.getDate();
            
            const dateKey = DateUtils.formatDateKey(cellDate);
            const today = DateUtils.getToday();
            
            if (cellDate.getMonth() !== this.currentMonth.getMonth()) {
                dayElement.style.opacity = '0.3';
                dayElement.style.cursor = 'default';
            } else if (cellDate < today) {
                dayElement.style.opacity = '0.3';
                dayElement.style.cursor = 'default';
            } else {
                if (this.availableSlots[dateKey] && this.availableSlots[dateKey].length > 0) {
                    const hasAvailableSlots = this.availableSlots[dateKey].some(time => 
                        !this.bookedVisits[dateKey] || !this.bookedVisits[dateKey][time]
                    );
                    if (hasAvailableSlots) {
                        dayElement.classList.add('has-visits');
                    }
                }
                
                dayElement.onclick = () => this.openMemberModal(cellDate);
            }
            
            calendar.appendChild(dayElement);
        }
    }

    // Abrir modal do membro com data corrigida
    openMemberModal(date) {
        console.log('=== 🔍 SELEÇÃO DE DATA ===');
        DateUtils.debugDate(date, 'Data Clicada');
        
        // Criar data limpa usando DateUtils
        this.selectedDate = DateUtils.createCleanDate(date.getFullYear(), date.getMonth(), date.getDate());
        
        DateUtils.debugDate(this.selectedDate, 'Data Selecionada Final');
        console.log('==========================');
        
        const dateKey = DateUtils.formatDateKey(this.selectedDate);
        
        document.getElementById('member-modal').style.display = 'block';
        document.getElementById('member-selected-date').textContent = DateUtils.formatDateDisplay(this.selectedDate);
        
        const timeSlotsContainer = document.getElementById('member-time-slots');
        timeSlotsContainer.innerHTML = '';
        
        if (this.availableSlots[dateKey] && this.availableSlots[dateKey].length > 0) {
            this.availableSlots[dateKey].forEach(time => {
                if (!this.bookedVisits[dateKey] || !this.bookedVisits[dateKey][time]) {
                    const timeElement = document.createElement('div');
                    timeElement.className = 'time-slot';
                    timeElement.textContent = time;
                    timeElement.onclick = () => this.selectMemberTime(time);
                    timeSlotsContainer.appendChild(timeElement);
                }
            });
            
            if (timeSlotsContainer.children.length === 0) {
                timeSlotsContainer.innerHTML = '<div class="no-visits">Todos os horários estão ocupados para esta data.</div>';
            }
        } else {
            timeSlotsContainer.innerHTML = '<div class="no-visits">Nenhum horário disponível para esta data.</div>';
        }
    }

    // Renderizar todas as visitas
    renderAllVisits() {
        const allVisitsList = document.getElementById('all-visits-list');
        allVisitsList.innerHTML = '';
        
        const allVisits = [];
        
        Object.keys(this.bookedVisits).forEach(dateKey => {
            Object.keys(this.bookedVisits[dateKey]).forEach(time => {
                const visit = this.bookedVisits[dateKey][time];
                allVisits.push({
                    date: dateKey,
                    time: time,
                    ...visit
                });
            });
        });
        
        // Ordenar usando DateUtils
        allVisits.sort((a, b) => {
            const dateA = DateUtils.parseDateKey(a.date);
            const dateB = DateUtils.parseDateKey(b.date);
            
            if (DateUtils.isSameDay(dateA, dateB)) {
                return a.time.localeCompare(b.time);
            }
            
            return dateA.getTime() - dateB.getTime();
        });
        
        if (allVisits.length > 0) {
            allVisits.forEach(visit => {
                const visitCard = document.createElement('div');
                visitCard.className = 'visit-card';
                
                // Usar DateUtils para formatação correta
                const visitDate = DateUtils.parseDateKey(visit.date);
                const formattedDate = DateUtils.formatDateDisplay(visitDate);
                
                console.log('🎯 Renderizando visita:', {
                    dateKey: visit.date,
                    parsedDate: visitDate,
                    formattedDate: formattedDate,
                    time: visit.time
                });
                
                visitCard.innerHTML = `
                    <div class="visit-date">${formattedDate}</div>
                    <div class="visit-time">${visit.time}</div>
                    <div class="visit-info">
                        <div><strong>Nome:</strong> ${visit.name}</div>
                        <div><strong>Telefone:</strong> ${visit.phone}</div>
                    </div>
                    <div><strong>Endereço:</strong> ${visit.address}</div>
                    <div style="margin-top: 15px;">
                        <a href="tel:${visit.phone}" class="contact-btn phone-btn">📞 Ligar</a>
                        <a href="https://wa.me/55${visit.phone.replace(/\D/g, '')}" class="contact-btn whatsapp-btn" target="_blank">💬 WhatsApp</a>
                        <a href="https://maps.google.com/?q=${encodeURIComponent(visit.address)}" class="contact-btn maps-btn" target="_blank">🗺️ Ver no Mapa</a>
                    </div>
                `;
                
                allVisitsList.appendChild(visitCard);
            });
        } else {
            allVisitsList.innerHTML = '<div class="no-visits">📅 Nenhuma visita agendada ainda.<br>Libere horários no calendário para que os membros possam agendar.</div>';
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        // Máscara de telefone
        const phoneInput = document.getElementById('member-phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', function() {
                let value = this.value.replace(/\D/g, '');
                if (value.length <= 11) {
                    value = value.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '$1 $2 $3-$4');
                }
                this.value = value;
            });
        }

        // Enter no login
        const passwordInput = document.getElementById('pastor-password');
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    this.checkPassword();
                }
            });
        }
    }

    // Outras funções essenciais
    selectMemberTime(time) {
        this.selectedTime = time;
        document.querySelectorAll('#member-time-slots .time-slot').forEach(t => t.classList.remove('selected'));
        event.target.classList.add('selected');
        document.getElementById('member-booking-form').style.display = 'block';
    }

    closeMemberModal() {
        document.getElementById('member-modal').style.display = 'none';
        document.getElementById('member-booking-form').style.display = 'none';
        this.clearMemberForm();
    }

    clearMemberForm() {
        document.getElementById('member-name').value = '';
        document.getElementById('member-phone').value = '';
        document.getElementById('member-address').value = '';
        this.selectedTime = null;
    }

    // Navegação de mês
    changeMonth(direction) {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + direction);
        this.renderMemberCalendar();
    }

    changePastorMonth(direction) {
        this.pastorCurrentMonth.setMonth(this.pastorCurrentMonth.getMonth() + direction);
        this.renderPastorCalendar();
    }

    // Debug do storage
    debugStorage() {
        console.log('=== 🔍 DEBUG STORAGE COMPLETO ===');
        console.log('Firebase pronto:', this.storage.isFirebaseReady);
        console.log('Horários em memória:', this.availableSlots);
        console.log('Visitas em memória:', this.bookedVisits);
        console.log('================================');
        
        const totalHorarios = Object.keys(this.availableSlots).length;
        const totalVisitas = Object.keys(this.bookedVisits).length;
        
        const status = [];
        if (this.storage.isFirebaseReady) status.push('🔥 Firebase: OK');
        else status.push('⚠️ Só localStorage');
        
        alert(`🔍 DEBUG COMPLETO:\n\n📊 Dados em Memória:\n- ${totalHorarios} dias com horários\n- ${totalVisitas} dias com visitas\n\n☁️ Armazenamento:\n${status.join('\n')}\n\n📱 Veja o console para mais detalhes`);
    }

    // Renderizar calendário do pastor (versão básica)
    renderPastorCalendar() {
        console.log('🔄 Renderizando calendário do pastor...');
        // Implementação básica - funcionalidade completa pode ser adicionada depois
    }

    // Limpar todos os dados
    async clearAllData() {
        if (confirm('Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita!')) {
            // Limpar storages
            const keys = ['visitasPastoraisCarlos', 'visitasPastoraisCarlosBackup'];
            keys.forEach(key => localStorage.removeItem(key));
            sessionStorage.removeItem('visitasPastoraisCarlos_session');
            
            // Limpar memória
            this.availableSlots = {};
            this.bookedVisits = {};
            
            alert('🗑️ Todos os dados foram removidos!');
            
            // Recarregar interface
            this.renderMemberCalendar();
            if (this.pastorLoggedIn) {
                this.renderAllVisits();
            }
        }
    }
}

// Instância global da aplicação
let app;

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    app = new VisitasPastoraisApp();
    app.init();
});

// Funções globais para os eventos HTML
function showPanel(panel) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.panel-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(panel + '-panel').classList.add('active');
    event.target.classList.add('active');
    
    if (panel === 'member') {
        app.renderMemberCalendar();
    } else if (app.pastorLoggedIn) {
        app.renderAllVisits();
    }
}

function checkPassword() { app.checkPassword(); }
function checkEnter(event) { if (event.key === 'Enter') app.checkPassword(); }
function logout() { app.logout(); }
function confirmBooking() { app.confirmBooking(); }
function cancelBooking() { app.closeMemberModal(); }
function closeMemberModal() { app.closeMemberModal(); }
function changeMonth(direction) { app.changeMonth(direction); }
function changePastorMonth(direction) { app.changePastorMonth(direction); }
function debugStorage() { app.debugStorage(); }
function clearAllData() { app.clearAllData(); }
