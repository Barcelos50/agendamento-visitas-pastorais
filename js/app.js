// Renderizar calendário do pastor (versão completa)
renderPastorCalendar() {
    const calendar = document.getElementById('pastor-calendar');
    const monthText = document.getElementById('pastor-current-month');
    
    if (!calendar || !monthText) {
        console.log('Elementos do calendário do pastor não encontrados');
        return;
    }
    
    monthText.textContent = `${this.months[this.pastorCurrentMonth.getMonth()]} ${this.pastorCurrentMonth.getFullYear()}`;
    calendar.innerHTML = '';
    
    // Headers
    this.weekDays.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-header';
        dayHeader.textContent = day;
        calendar.appendChild(dayHeader);
    });
    
    // Days
    const firstDay = new Date(this.pastorCurrentMonth.getFullYear(), this.pastorCurrentMonth.getMonth(), 1);
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
        
        if (cellDate.getMonth() !== this.pastorCurrentMonth.getMonth()) {
            dayElement.style.opacity = '0.3';
            dayElement.style.cursor = 'default';
        } else if (cellDate < today) {
            dayElement.style.opacity = '0.3';
            dayElement.style.cursor = 'default';
        } else {
            // Aplicar cores baseadas no status
            const hasBookedVisits = this.bookedVisits[dateKey] && Object.keys(this.bookedVisits[dateKey]).length > 0;
            const hasAvailableSlots = this.availableSlots[dateKey] && this.availableSlots[dateKey].length > 0;
            const hasAvailableTime = hasAvailableSlots && this.availableSlots[dateKey].some(time => 
                !this.bookedVisits[dateKey] || !this.bookedVisits[dateKey][time]
            );
            
            if (hasBookedVisits && hasAvailableTime) {
                dayElement.classList.add('has-both');
            } else if (hasBookedVisits) {
                dayElement.classList.add('has-visits');
            } else if (hasAvailableTime) {
                dayElement.classList.add('has-available');
            }
            
            dayElement.onclick = () => this.openPastorModal(cellDate);
        }
        
        calendar.appendChild(dayElement);
    }
}

// Abrir modal do pastor
openPastorModal(date) {
    this.selectedPastorDate = date;
    this.selectedPastorTimes = [];
    const dateKey = DateUtils.formatDateKey(date);
    
    document.getElementById('pastor-modal').style.display = 'block';
    document.getElementById('pastor-selected-date').textContent = DateUtils.formatDateDisplay(date);
    
    // Renderizar horários disponíveis para liberação
    const timeSlotsContainer = document.getElementById('pastor-time-slots');
    timeSlotsContainer.innerHTML = '';
    
    this.timeSlots.forEach(time => {
        const timeElement = document.createElement('div');
        timeElement.className = 'time-slot';
        timeElement.textContent = time;
        
        if (this.availableSlots[dateKey] && this.availableSlots[dateKey].includes(time)) {
            timeElement.classList.add('available');
            timeElement.textContent += ' ✓';
        }
        
        if (this.bookedVisits[dateKey] && this.bookedVisits[dateKey][time]) {
            timeElement.classList.add('occupied');
            timeElement.textContent = time + ' (Ocupado)';
        } else {
            timeElement.onclick = () => this.togglePastorTime(time);
        }
        
        timeSlotsContainer.appendChild(timeElement);
    });
    
    // Renderizar visitas do dia
    this.renderDayVisits(dateKey);
}

// Alternar seleção de horários do pastor
togglePastorTime(time) {
    const index = this.selectedPastorTimes.indexOf(time);
    if (index > -1) {
        this.selectedPastorTimes.splice(index, 1);
        event.target.classList.remove('selected');
    } else {
        this.selectedPastorTimes.push(time);
        event.target.classList.add('selected');
    }
}

// Liberar horários selecionados
async releaseSelectedTimes() {
    if (!this.selectedPastorDate || this.selectedPastorTimes.length === 0) {
        alert('Selecione pelo menos um horário para liberar.');
        return;
    }
    
    const dateKey = DateUtils.formatDateKey(this.selectedPastorDate);
    if (!this.availableSlots[dateKey]) {
        this.availableSlots[dateKey] = [];
    }
    
    this.selectedPastorTimes.forEach(time => {
        if (!this.availableSlots[dateKey].includes(time)) {
            this.availableSlots[dateKey].push(time);
        }
    });
    
    console.log('Horários liberados para', dateKey, ':', this.selectedPastorTimes);
    
    // Salvar dados
    await this.saveData();
    
    this.selectedPastorTimes = [];
    this.openPastorModal(this.selectedPastorDate);
    this.renderPastorCalendar();
    
    alert('✅ Horários liberados com sucesso!');
}

// Renderizar visitas do dia específico
renderDayVisits(dateKey) {
    const visitsList = document.getElementById('day-visits-list');
    if (!visitsList) return;
    
    visitsList.innerHTML = '';
    
    if (this.bookedVisits[dateKey] && Object.keys(this.bookedVisits[dateKey]).length > 0) {
        Object.keys(this.bookedVisits[dateKey]).forEach(time => {
            const visit = this.bookedVisits[dateKey][time];
            const visitCard = document.createElement('div');
            visitCard.className = 'visit-card';
            
            visitCard.innerHTML = `
                <div class="visit-time">${time}</div>
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
            
            visitsList.appendChild(visitCard);
        });
    } else {
        visitsList.innerHTML = '<div class="no-visits">Nenhuma visita agendada para este dia.</div>';
    }
}

// Fechar modal do pastor
closePastorModal() {
    document.getElementById('pastor-modal').style.display = 'none';
    this.selectedPastorTimes = [];
}
