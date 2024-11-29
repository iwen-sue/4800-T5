const ocrButton = document.getElementById('ocrButton');
const fileId = ocrButton.getAttribute('data-file-id'); // Get fileId from data attribute
const fileType = ocrButton.getAttribute('data-file-type'); // Get fileType from data attribute

ocrButton.addEventListener('click', async () => {
    const ocrResultDiv = document.getElementById('ocrResult');
    ocrResultDiv.textContent = 'Processing...';

    try {
        const response = await fetch(`/ocr/${fileId}?fileType=${fileType}`); // Pass the file type
        const result = await response.json();
        console.log(result);

        if (result.success) {
            const formattedText = result.text.replace(/\r\n|\n/g, '<br>');
            ocrResultDiv.innerHTML = formattedText;
        } else {
            ocrResultDiv.textContent = 'Failed to extract text.';
        }
    } catch (error) {
        console.error('Error during OCR:', error);
        ocrResultDiv.textContent = 'An error occurred while processing.';
    }
});
