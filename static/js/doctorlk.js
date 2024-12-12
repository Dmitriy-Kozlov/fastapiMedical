// const authToken = localStorage.getItem('authToken')
let searchTimeout;


function renderDoctorInfo(doctor) {
    const doctorInfoHtml = `
    <h1>Личный кабинет врача</h1>
    <h2>${doctor.last_name} ${doctor.first_name}</h2>
    <p>${doctor.specialization}</p>
    `;
    document.getElementById('doctorInfo').innerHTML = doctorInfoHtml;
}

let appointments = null

function createAppointmentCard(appointment) {
  const card = document.createElement('div');
  card.className = `appointment-card ${appointment.status === 'completed' ? 'completed' : ''}`;
  const isoString = appointment.appointment_date;
  const date = new Date(isoString);

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  const time = `${hours}:${minutes}`;
  card.innerHTML = `
    <div class="appointment-header">
      <span class="appointment-time">${time}</span>
      <span class="patient-name" onclick="searchForPatient('${appointment.patient.last_name} ${appointment.patient.first_name}')">${appointment.patient.last_name} ${appointment.patient.first_name}</span>
      <span class="status-badge status-${appointment.status}">
        ${appointment.status === 'completed' ? 'Завершен' : 'Запланирован'}
      </span>
    </div>
    <textarea class="notes-area" id="notes-${appointment.id}">${appointment.notes}</textarea>
    <div class="button-group">
      <button class="save-btn" onclick="saveNotes(${appointment.id})">Сохранить заметки</button>
      <button class="complete-btn ${appointment.status === 'completed' ? 'completed' : ''}"
              onclick="toggleAppointmentStatus(${appointment.id})">
        ${appointment.status === 'completed' ? 'Отменить завершение' : 'Завершить прием'}
      </button>
    </div>
  `;

  return card;
}

function searchForPatient(patientName) {
  switchTab('search');
  const searchInput = document.getElementById('patientSearch');
  searchInput.value = patientName.split(' ')[0]; // Use only last name for search
  handleSearchInput();
}

async function toggleAppointmentStatus(appointmentId) {
  console.log(appointmentId)
  const appointment = appointments.find(a => a.id === appointmentId);
  console.log(appointment)
  if (appointment) {
    appointment.status = appointment.status === 'completed' ? 'scheduled' : 'completed';
    try {
        const response = await fetch(`/api/appointments/edit`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({"id": appointmentId, "status": appointment.status})
    })
      if (response.status === 401 || response.status === 403) {
        window.location.href = '/pages/login';
        }
        if (!response.ok) throw new Error('Failed to fetch appointments');


    } catch (error) {
        console.error('Error fetching appointments:', error);
    }
    await loadAppointments();
  }
}

async function loadAppointments() {
  const container = document.getElementById('appointmentsContainer');
  const date = document.getElementById('appointmentDate').value;
  container.innerHTML = '';

  try {
        const response = await fetch(`/api/doctors/doctor/appointments?input_date=${date}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
    })
    if (response.status === 401 || response.status === 403) {
        window.location.href = '/pages/login';
        }

        if (!response.ok) throw new Error('Failed to fetch appointments');
        appointments = await response.json();
        console.log(appointments)
        if (appointments) {
        appointments.sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

        appointments.forEach(appointment => {
      container.appendChild(createAppointmentCard(appointment));
    });
  } else {
    container.innerHTML = '<p>Нет записей на выбранную дату</p>';
  }
    } catch (error) {
        container.innerHTML = '<div class="error-message">Ошибка при загрузке данных. Пожалуйста, попробуйте позже.</div>';
        console.error('Error fetching appointments:', error);
    }

}

async function saveNotes(appointmentId) {
  const notes = document.getElementById(`notes-${appointmentId}`).value;
  try {
        const response = await fetch(`/api/appointments/edit`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({"id": appointmentId, "notes": notes})
    })
    if (response.status === 401 || response.status === 403) {
        window.location.href = '/pages/login';
        }

        if (!response.ok) throw new Error('Failed to fetch appointments');

    } catch (error) {
        console.error('Error fetching appointments:', error);
    }
  console.log(`Saving notes for appointment ${appointmentId}:`, notes);

  // Show success message
  alert('Заметки сохранены');
}


function handleSearchInput() {
  clearTimeout(searchTimeout);
  const searchTerm = document.getElementById('patientSearch').value.trim();

  if (searchTerm.length >= 3) {
    document.getElementById('searchSpinner').style.display = 'block';
    searchTimeout = setTimeout(() => {
      searchPatients(searchTerm);
    }, 500);
  } else {
    document.getElementById('patientSearchResults').innerHTML = '';
    document.getElementById('patientHistory').innerHTML = '';
  }
}

async function searchPatients(searchTerm) {
  try {
    const response = await fetch(`/api/patients/filter`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({"last_name": searchTerm})
    })
    if (response.status === 401 || response.status === 403) {
        window.location.href = '/pages/login';
        }
    const patients = await response.json();
    const resultsContainer = document.getElementById('patientSearchResults');
    document.getElementById('searchSpinner').style.display = 'none';

    if (patients.length === 0) {
      resultsContainer.innerHTML = '<p>Пациенты не найдены</p>';
      return;
    }

    resultsContainer.innerHTML = patients.map(patient => `
      <div class="patient-search-item" onclick="loadPatientHistory('${patient.id}')">
        <strong>${patient.last_name} ${patient.first_name}</strong><br>
        <small>Дата рождения: ${patient.birth_date}</small>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error searching patients:', error);
    document.getElementById('searchSpinner').style.display = 'none';
    document.getElementById('patientSearchResults').innerHTML =
      '<p>Произошла ошибка при поиске пациентов</p>';
  }
}

async function loadPatientHistory(patientId) {
  try {
    const response = await fetch(`/api/patients/patient/appointments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({"patient_id": patientId})
    })
    if (response.status === 401 || response.status === 403) {
        window.location.href = '/pages/login';
        }
    const history = await response.json();
    history.sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

    const historyContainer = document.getElementById('patientHistory');


    const visitsHtml = history.map(visit => {
    const appointmentDate = new Date(visit.appointment_date);
    const formattedDate = appointmentDate.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const formattedTime = appointmentDate.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return `
      <div class="appointment-card ${visit.status === 'completed' ? 'completed' : ''}">
        <div class="appointment-header">
          <span>${formattedDate} ${formattedTime}</span>
          <span>${visit.doctor.first_name} ${visit.doctor.last_name} (${visit.doctor.specialization})</span>
          <span class="status-badge status-${visit.status}">
            ${visit.status === 'completed' ? 'Завершен' : 'Запланирован'}
          </span>
        </div>
        <p>${visit.notes || 'Без заметок'}</p>
      </div>
    `;
}).join('');

    historyContainer.innerHTML = `
      <div class="patient-history">
        <h3>${history[0].patient.last_name} ${history[0].patient.first_name}</h3>
        ${visitsHtml}
      </div>
    `;

  } catch (error) {
    console.error('Error loading patient history:', error);
    document.getElementById('patientHistory').innerHTML =
      '<p>Произошла ошибка при загрузке истории пациента</p>';
  }
}


function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  const activeTab = document.querySelector(`.tab:nth-child(${tabName === 'daily' ? '1' : '2'})`);
  activeTab.classList.add('active');

  document.getElementById('dailyView').style.display = tabName === 'daily' ? 'block' : 'none';
  document.getElementById('searchView').style.display = tabName === 'search' ? 'block' : 'none';
}


async function fetchDoctorData() {
    try {
        const response = await fetch('/api/doctors/doctor', {
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


let doctorData = null
document.addEventListener('DOMContentLoaded', async () => {
  doctorData = await fetchDoctorData();
  renderDoctorInfo(doctorData);
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('appointmentDate').value = today;
  loadAppointments();
});