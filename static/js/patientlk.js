function openEditModal() {
    const modal = document.getElementById('editModal');
    // Populate form with current data
    document.getElementById('last_name').value = patientData.last_name;
    document.getElementById('first_name').value = patientData.first_name;
    document.getElementById('birth_date').value = patientData.birth_date;
    document.getElementById('phone_number').value = patientData.phone_number;
    document.getElementById('email').value = patientData.email;
    modal.style.display = 'block';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}


async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    let updatedData = Object.fromEntries(formData.entries());
    updatedData.id = patientData.id

    try {
        const response = await fetch('/api/patients/patient/edit', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(updatedData)
        });
        if (response.status === 401 || response.status === 403) {
            window.location.href = '/pages/login';
        }
        if (response.ok) {
            patientData = await response.json();
            patientData = await fetchPatientData();
            renderPatientInfo(patientData);
            closeEditModal();
        } else {
            throw new Error('Failed to update patient data');
        }
    } catch (error) {
        console.error('Error updating patient data:', error);
        alert('Произошла ошибка при обновлении данных');
    }
}


async function fetchPatientData() {
    try {
        const response = await fetch('/api/patients/patient', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        if (response.status === 401 || response.status === 403) {
        window.location.href = '/pages/login';
        }
        if (!response.ok) {
            throw new Error('Failed to fetch patient data');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching patient data:', error);
        throw error;
    }
}

function renderPatientInfo(patient) {
    const formattedDate = formatDate(patient.birth_date)
    const patientInfoHtml = `
        <div class="profile-photo">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="#999">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
        </div>
        <ul class="info-list">
            <li class="info-item">
                <div class="info-label">Фамилия</div>
                <div class="info-value">${patient.last_name}</div>
            </li>
            <li class="info-item">
                <div class="info-label">Имя</div>
                <div class="info-value">${patient.first_name}</div>
            </li>
            <li class="info-item">
                <div class="info-label">Дата рождения</div>
                <div class="info-value">${formattedDate}</div>
            </li>
            <li class="info-item">
                <div class="info-label">Телефон</div>
                <div class="info-value">${patient.phone_number}</div>
            </li>
            <li class="info-item">
                <div class="info-label">Email</div>
                <div class="info-value">${patient.email}</div>
            </li>
        </ul>
        <button class="edit-btn" onclick="openEditModal()">Редактировать данные</button>

    `;
    document.getElementById('patientInfo').innerHTML = patientInfoHtml;
}
function createAppointmentCard(appointment) {
    const appointmentDate = new Date(appointment.appointment_date);

// Преобразование времени с учетом временной зоны
const localDateString = appointmentDate.toLocaleString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false, // Для 24-часового формата
});

// Разделение часов и минут
const [hours, minutes] = localDateString.split(':');
    return `
        <div class="appointment-card">
            <div class="appointment-date">
                <div class="appointment-day">${new Date(appointment.appointment_date).getDate()}</div>
                <div class="appointment-month">${new Date(appointment.appointment_date).toLocaleString('ru', { month: 'short' })}</div>
            </div>
            <div class="appointment-info">
                <h3>${appointment.doctor.first_name} ${appointment.doctor.last_name}</h3>
                <div>${appointment.doctor.specialization}</div>
                    <div class="appointment-time">
                        ${hours}:${minutes}
                    </div>
                </div>
            <div class="status-badge status-${appointment.status}">
                ${appointment.status === 'scheduled' ? 'Предстоящий' : 'Завершён'}
            </div>
        </div>
    `;
}

async function switchTab(typeApp, patient, event) {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }

    const container = document.getElementById('appointmentsContainer');
    container.innerHTML = '<div class="loading"><div class="loading-spinner"></div><div>Загрузка приёмов...</div></div>';

    try {
        const response = await fetch(`/api/patients/patient/appointments?status=${typeApp === 'upcoming' ? 'scheduled' : 'completed'}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({"patient_id": patient.id})
    })
        if (response.status === 401 || response.status === 403) {
        window.location.href = '/pages/login';
        }
        if (!response.ok) throw new Error('Failed to fetch appointments');
        const appointments = await response.json();
        appointments.sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
        container.innerHTML = appointments
            .map(appointment => createAppointmentCard(appointment))
            .join('') || '<div class="info-value">Нет приёмов</div>';
    } catch (error) {
        container.innerHTML = '<div class="error-message">Ошибка при загрузке данных. Пожалуйста, попробуйте позже.</div>';
        console.error('Error fetching appointments:', error);
    }
}

function handleLogout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        localStorage.removeItem('authToken')
        window.location.href = '/pages/login';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
}

let patientData = null;
// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        patientData = await fetchPatientData();
        renderPatientInfo(patientData);
        await switchTab('upcoming', patientData);
    } catch (error) {
        document.getElementById('patientInfo').innerHTML = '<div class="error-message">Ошибка при загрузке данных. Пожалуйста, попробуйте позже.</div>';
    }
});