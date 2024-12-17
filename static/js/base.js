const authToken = localStorage.getItem('authToken')
const patientIdToken = localStorage.getItem('patientId')
const doctorIdToken = localStorage.getItem('doctorId')
const adminIdToken = localStorage.getItem('adminId')

function handleLogout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        localStorage.removeItem('authToken')
        window.location.href = '/pages/login';
    }
}
function handleSchedule() {
        window.location.href = '/pages/schedule';
}
function handleLk() {

    if (patientIdToken && patientIdToken !== "null") {
        window.location.href = '/pages/lk';
    } else if (doctorIdToken && doctorIdToken !== "null") {
        window.location.href = '/pages/doctorlk';
    } else if (adminIdToken && adminIdToken !== "null"){
        window.location.href = '/pages/adminlk';
    }
}