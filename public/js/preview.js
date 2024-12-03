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


document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners to all clickable copy blocks in the preview section
    document.querySelectorAll('.copy-icon').forEach(item => {
        item.addEventListener('click', () => {
            const textToCopy = item.getAttribute('data-copy');

            // Copy the text to clipboard
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    // Replace the copy icon with a check icon
                    item.classList.remove('fa-copy');
                    item.classList.add('fa-check');
                    item.style.color = '#007bff'; // Optional: Change the color to blue for success feedback

                    // Revert back to the copy icon after a short delay
                    setTimeout(() => {
                        item.classList.remove('fa-check');
                        item.classList.add('fa-copy');
                        item.style.color = ''; // Reset color
                    }, 2000); // Adjust the delay as needed
                })
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                });
        });
    });

    // Populate the data-copy attribute dynamically for OCR results
    const ocrResultElement = document.getElementById('ocrResult');
    const copyIcon = document.querySelector('#ocrResultContainer .copy-icon');
    if (ocrResultElement && copyIcon) {
        const observer = new MutationObserver(() => {
            copyIcon.setAttribute('data-copy', ocrResultElement.textContent.trim());
        });
        observer.observe(ocrResultElement, { childList: true, subtree: true });
    }
});



