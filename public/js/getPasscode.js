// for profile.ejs

const generatePasscodeForm = document.querySelector('.generate-passcode form');
const passcode = document.querySelector('.passcode');
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
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: `Error: ${data.error}`,
                });
            } else {
                Swal.fire({
                    icon: 'success',
                    title: 'Passcode Generated',
                    text: `Your passcode is: ${data.passcode}`,
                });
                passcode.innerHTML = `<p>Your passcode is: ${data.passcode}</p>`;
            }
        } catch (error) {
            console.error('Error during passcode generation:', error);
            Swal.fire({
                icon: 'error',
                title: 'Unexpected Error',
                text: 'An unexpected error occurred. Please try again.',
            });
        } finally {
            // Make the button visible again if needed
            submitButton.style.display = 'block';
        }
    });
} else {
    console.error("Generate passcode form not found in DOM.");
}
