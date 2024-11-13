const generatePasscodeForm = document.querySelector('.generate-passcode form');
if (generatePasscodeForm) {
    generatePasscodeForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        console.log('Submitting form...');

        // Reference the button for further modifications
        const submitButton = this.querySelector('.generate-passcode button');

        try {
            // Make button disappear
            submitButton.style.display = 'none';

            // Fetch request to generate passcode
            const response = await fetch('/generatePasscode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Server response:', data);

            // Handle server response
            if (data.error) {
                alert(`Error: ${data.error}`);
            } else {
                alert(`Passcode generated: ${data.passcode}`);
                window.location.reload();
            }
        } catch (error) {
            console.error('Error during passcode generation:', error);
            alert('An unexpected error occurred. Please try again.');
        }
    });
}
