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
                    item.style.color = '#90ee90'; // Optional: Change the color to green for success feedback

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