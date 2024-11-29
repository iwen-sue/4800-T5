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
    let selectedFiles = [];

    selectFileButton.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        const files = Array.from(fileInput.files);
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
        files.forEach(file => {
            const listItem = document.createElement('p');
            listItem.textContent = file.name;
            fileList.appendChild(listItem);
        });
    }

    function isValidPhoneNumber(phone) {
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        return phoneRegex.test(phone);
    }

    uploadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        phoneModal.style.display = 'flex';
    });

    submitPhoneBtn.addEventListener('click', () => {
        const phoneNumber = phoneInput.value.trim();

        if (!isValidPhoneNumber(phoneNumber)) {
            phoneError.textContent = 'Please enter a valid phone number in the format +1XXXXXXXXXX';
            return;
        }

        let formData = new FormData(uploadForm);
        formData.append('phoneNumber', phoneNumber);

        fetch(uploadForm.action, {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (response.redirected) {
                    window.location.href = response.url;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                phoneError.textContent = 'Upload failed. Please try again.';
            });
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