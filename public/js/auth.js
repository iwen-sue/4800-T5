function validateForm() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorMessage = document.getElementById('error-message');
    
    if (password.length < 8) {
        errorMessage.textContent = 'Password must be at least 8 characters long';
        return false;
    }
    
    if (password !== confirmPassword) {
        errorMessage.textContent = 'Passwords do not match';
        return false;
    }
    
    return true;
}