document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const selectFileButton = document.getElementById('select-file-button');
    const fileList = document.getElementById('file-list');
    const uploadForm = document.getElementById('combined-upload-form');
    const phoneModal = document.getElementById('phone-modal');
    const phoneInput = document.getElementById('phone-input');
    const submitPhoneBtn = document.getElementById('submit-phone');
    const cancelPhoneBtn = document.getElementById('cancel-phone');
    const phoneError = document.getElementById('phone-error');
    const textArea = uploadForm.querySelector('textarea');
    const MAX_FILES = 5;
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
    
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


    selectFileButton.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
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

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

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

    function updateFileInput(files) {
        const dataTransfer = new DataTransfer();
        files.forEach(file => {
            dataTransfer.items.add(file);
        });
        fileInput.files = dataTransfer.files;
    }

    function updateFileList(files) {
        fileList.innerHTML = '';
        files.forEach((file, index) => {
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

    function isValidPhoneNumber(phone) {
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        return phoneRegex.test(phone);
    }

    uploadForm.addEventListener('submit', (e) => {
        const textValue = textArea.value.trim(); 

        // Prevent submission if both text and files are empty
        if (selectedFiles.length === 0 && textValue === '') {
            e.preventDefault();
            Swal.fire({
                icon: 'warning',
                title: 'Empty Submission',
                text: 'Please provide a description or upload at least one file before submitting.'
            });
            return;
        }

        e.preventDefault();
        phoneModal.style.display = 'flex';
    });

    submitPhoneBtn.addEventListener('click', async () => {
        const phoneNumber = phoneInput.value.trim();
        
        if (!isValidPhoneNumber(phoneNumber)) {
            phoneError.textContent = 'Please enter a valid phone number in the format +1XXXXXXXXXX';
            return;
        }
    
        try {
            const smsResponse = await fetch('/generatePasscodeSMS', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone: phoneNumber })
            });
    
            const data = await smsResponse.json();
            
            if (!smsResponse.ok) {
                Swal.fire({
                    icon: 'error',
                    title: 'SMS Error',
                    text: data.error || 'Failed to send SMS'
                });
                return;
            }
            
            let formData = new FormData(uploadForm);
            formData.append('phoneNumber', phoneNumber);
    
            const uploadResponse = await fetch(uploadForm.action, {
                method: 'POST',
                body: formData
            });
    
            if (uploadResponse.redirected) {
                // window.location.href = uploadResponse.url;
                window.location.href = '/'
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Upload Failed',
                    text: 'Could not complete the upload. Please try again.'
                });
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Submission Error',
                text: 'Upload failed. Please try again.'
            });
        }
    });

    cancelPhoneBtn.addEventListener('click', () => {
        phoneModal.style.display = 'none';
        phoneInput.value = '';
        phoneError.textContent = '';
    });

    phoneModal.addEventListener('click', (e) => {
        if (e.target === phoneModal) {
            phoneModal.style.display = 'none';
            phoneInput.value = '';
            phoneError.textContent = '';
        }
    });
});