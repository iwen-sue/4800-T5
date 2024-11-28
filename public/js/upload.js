document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const selectFileButton = document.getElementById('select-file-button'); // Button to trigger file input
    const fileList = document.getElementById('file-list'); // File list container
    let selectedFiles = [];

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
        files.forEach(file => {
            const listItem = document.createElement('p');
            listItem.textContent = file.name;
            fileList.appendChild(listItem);
        });
        
    }
});
