document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners to all clickable copy blocks
    document.querySelectorAll('.copy-icon').forEach(item => {
        item.addEventListener('click', () => {
            const textToCopy = item.getAttribute('data-copy');

            // Copy the text to clipboard
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    // Replace the copy icon with a check icon
                    item.classList.remove('fa-copy');
                    item.classList.add('fa-check');
                    item.style.color = '#007bff'; // Optional: Change the color to green for success feedback

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
});

// Function to adjust the height of a textarea
function autoResizeTextareas() {
    const textareas = document.querySelectorAll('.text-block');
    textareas.forEach(textarea => {
        // Reset the height to shrink the textarea if text was deleted
        textarea.style.height = 'auto';

        // Adjust the height based on the scrollHeight, respecting the max-height
        const newHeight = Math.min(textarea.scrollHeight, 200); // max-height
        textarea.style.height = `${newHeight}px`;
    });
}

// Call the function on page load
document.addEventListener('DOMContentLoaded', autoResizeTextareas);


document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchableItems = document.querySelectorAll('.searchable-item');

    searchInput.addEventListener('input', () => {
        const filter = searchInput.value.toLowerCase();

        searchableItems.forEach(item => {
            const textContent = item.textContent.toLowerCase();
            if (textContent.includes(filter)) {
                item.style.display = ''; // Show item
            } else {
                item.style.display = 'none'; // Hide item
            }
        });
    });
});

