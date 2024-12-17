function handleSubmit(event) {
    event.preventDefault();
    const username = document.getElementById('email');
    const password = document.getElementById('password');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');

    // Reset errors
    emailError.style.display = 'none';
    passwordError.style.display = 'none';

    let hasError = false;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username.value)) {
        emailError.style.display = 'block';
        username.parentElement.classList.add('shake');
        setTimeout(() => {
            username.parentElement.classList.remove('shake');
        }, 500);
        hasError = true;
    }

    // Password validation
    if (password.value.length < 6) {
        passwordError.style.display = 'block';
        password.parentElement.classList.add('shake');
        setTimeout(() => {
            password.parentElement.classList.remove('shake');
        }, 500);
        hasError = true;
    }


    if (!hasError)
        fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "username": username.value,
                "password": password.value
            })
        })
        .then(response => {
                if (response.status === 401) {
                    return response.json().then(error => {
                        alert(error.detail || 'Ошибка авторизации');
                        console.error('Login failed:', error.detail);
                        throw new Error(error.detail || 'Ошибка авторизации');
                    });
                }
                return response.json();
            })
        .then(data => {
            if (data.access_token) {
                localStorage.setItem('authToken', data.access_token);
                localStorage.setItem('patientId', data.patient_id);
                localStorage.setItem('doctorId', data.doctor_id);
                localStorage.setItem('adminId', data.admin_id);
                // Redirect or handle successful login
                if (data.doctor_id) {
                   window.location.href = '/pages/doctorlk';
                }
                if (data.patient_id) {
                   window.location.href = '/pages/lk';
                }
                if (data.admin_id) {
                    window.location.href = '/pages/adminlk';
                }
            } else {
        console.error('Login failed:', data.detail);
    }
        })
        .catch(error => {
            console.error('Error:', error);
        });

    return false;
}