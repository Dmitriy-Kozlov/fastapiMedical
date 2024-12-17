let doctorId = null

function createDoctorCard(doctor) {
  const card = document.createElement('div');
  card.className = 'doctor-card';
  const dayOrder = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];

const scheduleHtml = dayOrder.map(day => `
  <tr>
    <td>${day}</td>
    <td>${doctor.schedule?.[day] || 'нет приема'}</td>
  </tr>
`).join('');

  card.innerHTML = `
    <div class="doctor-name">${doctor.last_name} ${doctor.first_name}</div>
    <div class="doctor-specialty">${doctor.specialization}</div>
    <table class="schedule-table">
      <thead>
        <tr>
          <th>День</th>
          <th>Часы приема</th>
        </tr>
      </thead>
      <tbody>
        ${scheduleHtml}
      </tbody>
    </table>
    ${
      patientIdToken && patientIdToken !== "null"
        ? `<button class="btn-appointment" data-doctor-id=${doctor.id} onclick="openAppointmentModal(${doctor.id}, '${doctor.last_name} ${doctor.first_name}')">
             Записаться на прием
           </button>`
        : ""
    }
  `;

  return card;
}

function loadDoctors() {
  const container = document.getElementById('doctorsContainer');
  doctors.forEach(doctor => {
    container.appendChild(createDoctorCard(doctor));
  });
}

function openAppointmentModal(id, doctorName) {
  const modal = document.getElementById('appointmentModal');
  document.getElementById('appointmentTime').value = ''
  document.getElementById('appointmentDate').value = ''
  doctorId = id
  const doctorNameInput = document.getElementById('doctorName');
  const successMessage = document.getElementById('successMessage');

  doctorNameInput.value = doctorName;
  successMessage.style.display = 'none';
  modal.style.display = 'flex';
}

// Close modal when clicking outside
document.getElementById('appointmentModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('appointmentModal')) {
    e.target.style.display = 'none';
  }
});


document.getElementById('appointmentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    let patient_id = localStorage.getItem('patientId') // Предполагается, что `patientId` сохранен в localStorage
  const doctorName = document.getElementById('doctorName').value;
    const doctor = doctors.find(d => `${d.last_name} ${d.first_name}` === doctorName);
    if (!doctor) {
        alert('Ошибка: врач не найден');
        return;
    }
    // if (patient_id == null) {
if (!patient_id || patient_id === "null") {
  alert(`Ошибка: Id пациента не найдено`);
} else {
      const formData = {
        patient_id: patient_id,
        // doctor_id: doctors.find(d => d.name === document.getElementById('doctorName').value)?.id,
        doctor_id: doctor.id,
        appointment_date: new Date(
            `${document.getElementById('appointmentDate').value}T${document.getElementById('appointmentTime').value}`
        ).toISOString(),
        notes: '' // Если есть поле для заметок, можно заменить на его значение
    };


    try {
        const response = await fetch('/api/appointments/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(formData)
        });
        if (response.status === 401 || response.status === 403) {
        window.location.href = '/pages/login';
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create appointment');
        }

        // Показываем сообщение об успехе
        document.getElementById('successMessage').style.display = 'block';

        // Сбрасываем форму
        document.getElementById('appointmentDate').value = '';
        document.getElementById('appointmentTime').value = '';

        // Закрываем модальное окно через 2 секунды
        setTimeout(() => {
            document.getElementById('appointmentModal').style.display = 'none';
        }, 2000);
    } catch (error) {
        console.error('Error creating appointment:', error);
        alert(`Ошибка: ${error.detail}`);
    }
}

});


async function loadAvailableSlots(doctorId, selectedDate) {
    const timeSelect = document.getElementById('appointmentTime');
    timeSelect.innerHTML = '';

    // Get doctor's working hours
    const doctor = doctors.find(d => d.id === doctorId);
    if (!doctor || !doctor.schedule) return;

    const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const dayName = dayNames[new Date(selectedDate).getDay()];
    if (!doctor.schedule[dayName]) return;

    const [start, end] = doctor.schedule[dayName].split(' - ');
    const startHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);

    // Fetch occupied slots from backend
    const response = await fetch('/api/appointments/filter', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
            doctor_id: doctorId,
            input_date: selectedDate
        })
    });

    if (!response.ok) {
        console.error('Failed to load appointments');
        return;
    }

    const occupiedSlots = await response.json();
    const occupiedTimes = occupiedSlots.map(a => new Date(a.appointment_date).toTimeString().slice(0, 5));
    // Generate available time slots
    for (let hour = startHour; hour < endHour; hour++) {
        ['00', '30'].forEach(minutes => {
            const slot = `${hour.toString().padStart(2, '0')}:${minutes}`;
            if (!occupiedTimes.includes(slot)) {
                const option = document.createElement('option');
                option.value = slot;
                option.textContent = slot;
                timeSelect.appendChild(option);
            }
        });
    }
}

// Attach the function to the date input change event
document.getElementById('appointmentDate').addEventListener('change', (e) => {
    const selectedDate = e.target.value;
    if (doctorId && selectedDate) {
        loadAvailableSlots(doctorId, selectedDate);
    }
});



async function fetchDoctorsData() {
    try {
        const response = await fetch('/api/doctors/all_with_schedule', {
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

let doctors = null;
// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        doctors = await fetchDoctorsData();
        loadDoctors(doctors);
    } catch (error) {
        console.log(error)
    }
});
