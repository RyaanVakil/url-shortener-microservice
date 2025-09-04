// In frontend-service/public/script.js
const urlInput = document.getElementById('url-input');
const shortenBtn = document.getElementById('shorten-btn');
const resultContainer = document.getElementById('result-container');
const shortUrlLink = document.getElementById('short-url');

const API_URL = '/api/shorten'; 

shortenBtn.addEventListener('click', async () => {
    const longUrl = urlInput.value;
    if (!longUrl) {
        alert('Please enter a URL.');
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: longUrl }),
        });

        if (!response.ok) {
            throw new Error('Failed to shorten URL.');
        }

        const data = await response.json();
        
        shortUrlLink.href = data.short_url;
        shortUrlLink.textContent = data.short_url;
        resultContainer.classList.remove('hidden');

    } catch (error) {
        alert(error.message);
    }
});