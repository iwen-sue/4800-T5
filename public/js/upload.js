document.addEventListener('DOMContentLoaded', () => {
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
            alert(validationErrors.join('\n'));
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
            alert(validationErrors.join('\n'));
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

     // Prevent form submission if no text or file is provided
     form.addEventListener('submit', (e) => {
        const textValue = textArea.value.trim(); // Get trimmed text value
        if (selectedFiles.length === 0 && textValue === '') {
            e.preventDefault(); // Prevent form submission
            alert('Please provide a description or upload at least one file before submitting.');
        }
    });

});
