document.addEventListener('DOMContentLoaded', () => {
    const messagesContainer = document.getElementById('messages-container');
    const successMessage = messagesContainer.dataset.successMessage;
    const errorMessage = messagesContainer.dataset.errorMessage;

    // Display SweetAlert2 dialogs for success or error messages
    if (successMessage) {
        Swal.fire({
            // position: 'top-end',
            icon: 'success',
            title: successMessage,
            showConfirmButton: false,
            timer: 2500
        });
    }

    if (errorMessage) {
        Swal.fire({
            // position: 'top-end',
            icon: 'error',
            title: errorMessage,
            showConfirmButton: false,
            timer: 2500
        });
    }


    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const selectFileButton = document.getElementById('select-file-button'); // Button to trigger file input
    const fileList = document.getElementById('file-list'); // File list container
    const form = document.getElementById('combined-upload-form'); // Form element
    const textArea = form.querySelector('textarea'); // Textarea element
    const MAX_FILES = 5;
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    let selectedFiles = [];


     // File validation function
     function validateFiles(files) {
        const errorMessages = [];

        // Check number of files
        if (selectedFiles.length + files.length > MAX_FILES) {
            errorMessages.push(`You can upload a maximum of ${MAX_FILES} files.`);
        }

        // Check individual file sizes
        files.forEach(file => {
            if (file.size > MAX_FILE_SIZE) {
                errorMessages.push(`${file.name} exceeds the 50 MB file size limit.`);
            }
        });

        return errorMessages;
    }


    // Highlight drop area on dragover
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    // Remove highlight on dragleave
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    // Handle file drop
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');

        const files = Array.from(e.dataTransfer.files);
        const validationErrors = validateFiles(files);

        if (validationErrors.length > 0) {
            Swal.fire({
                icon: 'error',
                title: 'File Validation Error',
                html: validationErrors.join('<br>')
            });
            return;
        }

        if (files.length > 0) {
            selectedFiles = [...selectedFiles, ...files];
            updateFileList(selectedFiles);
            updateFileInput(selectedFiles);
        }
    });

    // Handle file selection via "Select Files" button
    selectFileButton.addEventListener('click', () => {
        fileInput.click(); // Trigger file input dialog
    });

    // Handle file selection via file input
    fileInput.addEventListener('change', () => {
        const files = Array.from(fileInput.files);
        const validationErrors = validateFiles(files);
        
        if (validationErrors.length > 0) {
            Swal.fire({
                icon: 'error',
                title: 'File Validation Error',
                html: validationErrors.join('<br>')
            });
            e.target.value = ''; // Clear the file input
            return;
        }

        selectedFiles = [...selectedFiles, ...files];
        updateFileList(selectedFiles);
    });

    // Function to update the file input with selected files
    function updateFileInput(files) {
        const dataTransfer = new DataTransfer();
        files.forEach(file => {
            dataTransfer.items.add(file);
        });
        fileInput.files = dataTransfer.files; // Assign the new FileList to fileInput
    }


    // Function to display the file names
    function updateFileList(files) {
        fileList.innerHTML = '';
        files.forEach((file , index) => {
            const listItem = document.createElement('p');
            listItem.textContent = file.name;

            // Add remove button
            const removeButton = document.createElement('button');
            removeButton.textContent = '✕';
            removeButton.type = 'button';
            removeButton.classList.add('remove-button'); 

            removeButton.addEventListener('click', () => {
                selectedFiles.splice(index, 1);
                updateFileList(selectedFiles);
                updateFileInput(selectedFiles);
            });

            listItem.appendChild(removeButton);
            fileList.appendChild(listItem);
        });
        
    }

    // Check or generate passcode
    async function checkAndGeneratePasscode() {
        try {
            const response = await fetch('/checkPasscode', { method: 'GET', headers: { 'Content-Type': 'application/json' } });
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            if (data.passcode) {
                await Swal.fire({
                    icon: 'info',
                    title: 'Passcode Found',
                    // text: `You already have a passcode: ${data.passcode}. Use the passcode to access your files later.`
                    html: `You already have a passcode: <strong>${data.passcode}</strong>.<br>Use the passcode to access your files later.`
                });
                return data.passcode;
            } else {
                const generateResponse = await fetch('/generatePasscode', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
                if (!generateResponse.ok) throw new Error(`HTTP error! Status: ${generateResponse.status}`);
                const generateData = await generateResponse.json();
                await Swal.fire({
                    icon: 'success',
                    title: 'Passcode Generated',
                    // text: `New passcode generated: ${generateData.passcode}. Access your files later using this passcode.`
                    html: `New passcode generated: <strong>${generateData.passcode}</strong>.<br>Access your files later using this passcode.`
                });
                return generateData.passcode;
            }
        } catch (error) {
            console.error('Error during passcode handling:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Could not generate or retrieve passcode. Please try again.'
            });
            return null;
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const textValue = textArea.value.trim();

        if (selectedFiles.length === 0 && textValue === '') {
            await Swal.fire({
                icon: 'warning',
                title: 'Empty Submission',
                text: 'Please provide a description or upload at least one file before submitting.'
            });
            return; 
        }

        try {
            // Ensure passcode exists before proceeding
            const passcode = await checkAndGeneratePasscode();
            if (!passcode) return;

            // Submit the form after passcode verification
            const formData = new FormData(form);
            const uploadResponse = await fetch(form.action, { method: 'POST', body: formData });
            if (uploadResponse.redirected) {
                window.location.href = uploadResponse.url; // Redirect based on server response
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Upload Failed',
                    text: 'Upload failed. Please try again.'
                });
            }
        } catch (error) {
            console.error('Submission error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Upload Error',
                text: 'Upload failed. Please try again.'
            });
        }


    });

});
