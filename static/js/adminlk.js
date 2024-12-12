// const authToken = localStorage.getItem('authToken')

function switchAdminTab(tabName) {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.admin-content');

    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');

    if (tabName === 'patients') loadPatients();
    if (tabName === 'doctors') loadDoctors();
    if (tabName === 'appointments') {
        loadPatientsForSelect();
        loadDoctorsForSelect();
    }
}

function toggleSpecialization() {
    const specializationGroup = document.getElementById('specializationGroup');
    const roleValue = document.querySelector('input[name="role"]:checked').value;
    specializationGroup.style.display = roleValue === 'doctor' ? 'block' : 'none';
}

async function handleRegister(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Пользователь успешно зарегистрирован');
            event.target.reset();
        } else {
           const errorData = await response.json(); // Читаем тело ответа как JSON
        if (errorData.detail) {
            alert(`Ошибка: ${errorData.detail}`); // Отображаем сообщение сервера
        } else {
            alert('Ошибка при регистрации пользователя.');
        }}
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при регистрации пользователя.');
    }
}

async function loadPatients() {
    try {
        // const response = await fetch('/api/patients/all');
        const response = await fetch('/api/patients/all', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
        });
        const patients = await response.json();
        displayPatients(patients);
    } catch (error) {
        console.error('Error loading patients:', error);
    }
}

async function loadDoctors() {
    try {
        // const response = await fetch('/api/doctors/all', {
        const response = await fetch('/api/doctors/all_with_schedule', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
        });
        const doctors = await response.json();
        console.log(doctors)
        displayDoctors(doctors);
    } catch (error) {
        console.error('Error loading doctors:', error);
    }
}

function displayPatients(patients) {
    const container = document.getElementById('patientsList');
    container.innerHTML = patients.map(patient => `
        <div class="user-card" data-lastname="${patient.last_name.toLowerCase()}">
            <div class="user-info">
                <h3>${patient.last_name} ${patient.first_name}</h3>
                <div>${patient.email} | ${patient.phone_number}</div>
            </div>
            <div class="user-actions">
                <button onclick="editPatient(${patient.id})" class="edit-btn">Редактировать</button>
            </div>
        </div>
    `).join('');
}

function displayDoctors(doctors) {
    const container = document.getElementById('doctorsList');

    // Определяем порядок дней недели
    const dayOrder = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];

    container.innerHTML = doctors.map(doctor => `
        <div class="user-card" data-lastname="${doctor.last_name.toLowerCase()}">
            <div class="user-info">
                <h3>${doctor.last_name} ${doctor.first_name}</h3>
                <div>${doctor.specialization} | ${doctor.phone_number}</div>
                <div class="schedule-display">
                    <h4>Расписание:</h4>
                    ${
                        dayOrder.map(day => `
                            <div class="schedule-row">
                                <span class="day">${day}:</span>
                                <span class="time">${doctor.schedule?.[day] || 'нет приема'}</span>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
            <div class="user-actions">
                <button onclick="editDoctor(${doctor.id})" class="edit-btn">Редактировать</button>
                <button onclick="editSchedule(${doctor.id})" class="edit-btn schedule-btn">Расписание</button>
            </div>
        </div>
    `).join('');
}


function filterPatients() {
    const search = document.getElementById('patientSearch').value.toLowerCase();
    const cards = document.querySelectorAll('#patientsList .user-card');
    cards.forEach(card => {
        const lastName = card.dataset.lastname;
        card.style.display = lastName.includes(search) ? 'flex' : 'none';
    });
}

function filterDoctors() {
    const search = document.getElementById('doctorSearch').value.toLowerCase();
    const cards = document.querySelectorAll('#doctorsList .user-card');
    cards.forEach(card => {
        const lastName = card.dataset.lastname;
        card.style.display = lastName.includes(search) ? 'flex' : 'none';
    });
}


document.getElementById('app_date').addEventListener('change', (e) => {
    const selectedDate = e.target.value;
    const doctorId = document.getElementById('app_doctor').value
    console.log(doctorId)
    if (doctorId && selectedDate) {
        loadAvailableSlots(doctorId, selectedDate);
    }
});



async function loadAvailableSlots(doctorId, selectedDate) {
    const timeSelect = document.getElementById('appointmentTime');
    timeSelect.innerHTML = '';

    // Get doctor's working hours
    const doctor = doctors.find(d => d.id === Number(doctorId));
    console.log(doctors)
    console.log(doctor)
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
    console.log(occupiedSlots, occupiedTimes)
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


async function handleAppointmentCreate(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    // Слот времени из выпадающего списка
    const selectedTime = document.getElementById('appointmentTime').value;
    if (!selectedTime) {
        alert('Выберите доступное время.');
        return;
    }

    const appointmentDate = new Date(`${data.date}T${selectedTime}:00`);
    data.appointment_date = appointmentDate.toISOString(); // Преобразуем в строку ISO 8601
    data.notes = 'Создано администратором';

    // Удаляем поля date, так как оно больше не нужно
    delete data.date;
    console.log(data);

    try {
        const response = await fetch('/api/appointments/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Запись успешно создана');
            document.getElementById('appointmentTime').value = ''
            document.getElementById('app_date').value = ''
            event.target.reset();
        } else {
            const errorData = await response.json(); // Читаем тело ответа как JSON
            if (errorData.detail) {
                alert(`Ошибка: ${errorData.detail}`); // Отображаем сообщение сервера
            } else {
                alert('Ошибка при создании записи. Попробуйте снова.');
            }
        }
    } catch (error) {
        console.error('Error creating appointment:', error);
        alert('Ошибка при создании записи');
    }
}


async function editPatient(id) {
    try {
        // const response = await fetch(`/api/patients/${id}`);
        const response = await fetch(`/api/patients/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
        });
        const patient = await response.json();

        document.getElementById('edit_id').value = patient.id;
        document.getElementById('edit_type').value = 'patient';
        document.getElementById('edit_firstName').value = patient.first_name;
        document.getElementById('edit_lastName').value = patient.last_name;
        document.getElementById('edit_email').value = patient.email;
        document.getElementById('edit_phone').value = patient.phone_number;
        document.getElementById('edit_birthDate').value = patient.birth_date;

        document.getElementById('edit_specializationGroup').style.display = 'none';
        document.getElementById('edit_birthDateGroup').style.display = 'block';

        document.getElementById('editModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading patient data:', error);
    }
}

async function editDoctor(id) {
    try {
        // const response = await fetch(`/api/doctors/${id}`);
        const response = await fetch(`/api/doctors/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
        });
        const doctor = await response.json();

        document.getElementById('edit_id').value = doctor.id;
        document.getElementById('edit_type').value = 'doctor';
        document.getElementById('edit_firstName').value = doctor.first_name;
        document.getElementById('edit_lastName').value = doctor.last_name;
        document.getElementById('edit_email').value = doctor.email;
        document.getElementById('edit_phone').value = doctor.phone_number;
        document.getElementById('edit_specialization').value = doctor.specialization;

        document.getElementById('edit_specializationGroup').style.display = 'block';
        document.getElementById('edit_birthDateGroup').style.display = 'none';

        document.getElementById('editModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading doctor data:', error);
    }
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('editForm').reset();
}

async function handleEditSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    const type = data.type;
    delete data.type;
    if (!data.birth_date) {
        data.birth_date = null;
    }

    try {
        const endpoint = type === 'patient' ? '/api/patients/patient/edit' : '/api/doctors/doctor/edit';
        if (type === 'patient' ) {
            delete data.specialization
        }
        if (type === 'doctor' ) {
            delete data.birth_date
        }
        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Данные успешно обновлены');
            closeEditModal();
            if (type === 'patient') {
                loadPatients();
            } else {
                loadDoctors();
            }
        } else {
            throw new Error('Failed to update data');
        }
    } catch (error) {
        console.error('Error updating data:', error);
        alert('Ошибка при обновлении данных');
    }
}

async function loadPatientsForSelect() {
    try {
        // const response = await fetch('/api/patients/all');
         const response = await fetch('/api/patients/all', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
        });
        const patients = await response.json();
        const select = document.getElementById('app_patient');
        select.innerHTML = patients.map(patient =>
            `<option value="${patient.id}">${patient.last_name} ${patient.first_name}</option>`
        ).join('');
    } catch (error) {
        console.error('Error loading patients for select:', error);
    }
}

async function loadDoctorsForSelect() {
    try {
        // const response = await fetch('/api/doctors/all');
        const response = await fetch('/api/doctors/all', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
        });
        const doctors = await response.json();
        const select = document.getElementById('app_doctor');
        select.innerHTML = doctors.map(doctor =>
            `<option value="${doctor.id}">${doctor.last_name} ${doctor.first_name} (${doctor.specialization})</option>`
        ).join('');
    } catch (error) {
        console.error('Error loading doctors for select:', error);
    }
}


function editSchedule(doctorId) {
    fetch('/api/schedules/filter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({"doctor_id": doctorId})
        })
    // fetch(`/api/doctors/${doctorId}`)
    .then(response => response.json())
    .then(schedule => {
    document.getElementById('schedule_doctor_id').value = doctorId;

    // Преобразуем расписание в объект, где ключи - дни недели (например, 'monday')
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday','sunday',];
    const formattedSchedule = {};

    schedule.forEach(entry => {
        const dayName = dayNames[entry.day_of_week];
        formattedSchedule[dayName] = {
            id: entry.id,
            start: entry.start_time.slice(0, 5), // Преобразуем в формат HH:mm
            end: entry.end_time.slice(0, 5)
        };
    });

    console.log('Преобразованное расписание:', formattedSchedule);

    // Заполняем форму данными
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    days.forEach(day => {
        const daySchedule = formattedSchedule[day] || {};
        document.querySelector(`[name="${day}_id"]`).value = daySchedule.id || null;
        document.querySelector(`[name="${day}_start"]`).value =
            daySchedule.start || '';
        document.querySelector(`[name="${day}_end"]`).value =
            daySchedule.end || '';
    });

    // Отображаем модальное окно
    document.getElementById('scheduleModal').style.display = 'block';
})
.catch(error => console.error('Error loading doctor schedule:', error));

}

function closeScheduleModal() {
    document.getElementById('scheduleModal').style.display = 'none';
    document.getElementById('scheduleForm').reset();
}



function handleScheduleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const doctorId = formData.get('doctor_id');

    // Преобразуем данные формы в массив расписания
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const schedule = [];
    const scheduleNew = [];
    console.log(formData)
    dayNames.forEach((day, index) => {
        const id = formData.get(`${day}_id`);
        const start = formData.get(`${day}_start`);
        const end = formData.get(`${day}_end`);

        if (start && end && id) {
            schedule.push({
                id: id,
                doctor_id: parseInt(doctorId, 10),
                day_of_week: index, // Дни недели от 0 (понедельник) до 4 (пятница)
                start_time: start,
                end_time: end
            });
        }
        if (start && end && !id) {
            scheduleNew.push({
                doctor_id: parseInt(doctorId, 10),
                day_of_week: index, // Дни недели от 0 (понедельник) до 4 (пятница)
                start_time: start,
                end_time: end
            });
        }
    });
    console.log(schedule)
    console.log(scheduleNew)


    fetch(`/api/schedules/schedule/edit`, {
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(schedule)
})
    .then(response => {
        if (response.ok) {
            alert('Расписание успешно обновлено');

            // Проверяем, если объект scheduleNew не пустой, отправляем его
            if (Object.keys(scheduleNew).length > 0) {
                return fetch(`/api/schedules/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(scheduleNew)
                });
            }
        } else {
            throw new Error('Failed to update schedule');
        }
    })
    .then(response => {
        if (response && response.ok) {
            alert('Новое расписание успешно добавлено');
        }
    })
    .catch(error => {
        console.error('Error updating schedule:', error);
        alert('Ошибка при обновлении расписания');
    })
    .finally(() => {
        closeScheduleModal();
        loadDoctors();
    });

}


let doctors = null;

// function handleLogout() {
//     if (confirm('Вы уверены, что хотите выйти?')) {
//         localStorage.removeItem('authToken')
//         window.location.href = '/pages/login';
//     }
// }

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

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    doctors = await fetchDoctorsData();
    // switchAdminTab('register');
});