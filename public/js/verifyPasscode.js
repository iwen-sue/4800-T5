document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('.otp-inputs input');
    const otpContainer = document.querySelector('.otp-inputs');
    const statusMessage = document.querySelector('.status-message');
    
    async function verifyPasscode() {
        let isValid = false;
        const otp = Array.from(inputs).map(input => input.value).join('');
        if (otp.length === 6) {
            console.log('Verifying OTP:', otp);
            try {
                const response = await fetch('/verifyPasscode', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ passcode: otp })
                });
    
                const result = await response.json();
                if (response.ok) {
                    console.log('Success:', result.message);
                    isValid = true;

                    setTimeout(async () => {
                        await Swal.fire({
                            icon: 'success',
                            title: 'Token Verified',
                            text: result.message,
                            showConfirmButton: false,
                            timer: 1500
                        });
                        statusMessage.textContent = '';
                        window.location.href = result.redirectUrl;
                    }, 500);
                } else {
                    console.error('Error:', result.error);

                    await Swal.fire({
                        icon: 'error',
                        title: 'Verification Failed',
                        text: result.error || 'Invalid Token. Please try again.',
                    });

                    isValid = false;
                }
            } catch (error) {
                console.error('Error:', error);

                await Swal.fire({
                    icon: 'error',
                    title: 'Unexpected Error',
                    text: 'An unexpected error occurred. Please try again later.',
                });
            }

            if (isValid) {
                otpContainer.classList.remove('error');
                otpContainer.classList.add('success');
                statusMessage.textContent = 'Verifying...';
                statusMessage.classList.add('success-message');
                statusMessage.classList.remove('error-message');
            } else {
                otpContainer.classList.remove('success');
                otpContainer.classList.add('error');
                statusMessage.textContent = 'Invalid Token. Please try again.';
                statusMessage.classList.add('error-message');
                statusMessage.classList.remove('success-message');
            }
        } else {
            otpContainer.classList.remove('success', 'error');
            statusMessage.textContent = '';
        }
    }

    inputs.forEach((input, index) => {
        // Handle input
        input.addEventListener('input', function(e) {
            // Allow only alphanumeric characters
            this.value = this.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            
            // Auto-focus next input
            if (this.value && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
            
            // Verify OTP when all fields are filled
            verifyPasscode();
        });
        
        // Handle backspace
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !this.value && index > 0) {
                inputs[index - 1].focus();
            }
        });
        
        // Handle paste
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = e.clipboardData.getData('text');
            const alphanumeric = pastedText.match(/[A-Za-z0-9]/g);
            
            if (alphanumeric) {
                inputs.forEach((input, i) => {
                    if (alphanumeric[i]) {
                        input.value = alphanumeric[i].toUpperCase();
                    }
                });
                
                // Focus last input or first empty input
                const lastFilledInput = Array.from(inputs).findIndex(input => !input.value);
                if (lastFilledInput >= 0) {
                    inputs[lastFilledInput].focus();
                } else {
                    inputs[inputs.length - 1].focus();
                }
                
                // Verify OTP after paste
                verifyPasscode();
            }
        });
    });
});
