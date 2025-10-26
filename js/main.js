// DOM Elements
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const translateButton = document.getElementById('translateButton');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const charCount = document.getElementById('charCount');
const buttonText = document.getElementById('buttonText');
const swapButton = document.getElementById('swapButton');
const viEnOption = document.getElementById('viEnOption');
const enViOption = document.getElementById('enViOption');
const copyButton = document.getElementById('copyButton');

// API Key
const workerUrl = "https://text2llmgroq.text2team.workers.dev/"; // đổi thành URL Worker của bạn
const MAX_CHARS = 500;

// Copy functionality
copyButton.addEventListener('click', async () => {
    const textToCopy = outputText.value.trim();
    
    if (!textToCopy) {
        showError('No text to copy. Please translate something first.');
        return;
    }

    try {
        await navigator.clipboard.writeText(textToCopy);
        
        // Visual feedback
        copyButton.classList.add('copied');
        copyButton.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
        `;
        
        // Reset after 2 seconds
        setTimeout(() => {
            copyButton.classList.remove('copied');
            copyButton.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
            `;
        }, 2000);
        
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        // Visual feedback
        copyButton.classList.add('copied');
        copyButton.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
        `;
        
        // Reset after 2 seconds
        setTimeout(() => {
            copyButton.classList.remove('copied');
            copyButton.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
            `;
        }, 2000);
    }
});

// Translation direction state
let currentDirection = 'vi-en';

// Character counter
inputText.addEventListener('input', () => {
    const currentLength = inputText.value.length;
    if (currentLength > MAX_CHARS) {
        inputText.value = inputText.value.substring(0, MAX_CHARS);
        charCount.textContent = `${MAX_CHARS}/${MAX_CHARS} characters (limit reached)`;
        charCount.classList.add('limit-reached');
    } else {
        charCount.textContent = `${currentLength}/${MAX_CHARS} characters`;
        charCount.classList.remove('limit-reached');
    }
});

// Direction selector
viEnOption.addEventListener('click', () => {
    currentDirection = 'vi-en';
    viEnOption.classList.add('active');
    enViOption.classList.remove('active');
});

enViOption.addEventListener('click', () => {
    currentDirection = 'en-vi';
    enViOption.classList.add('active');
    viEnOption.classList.remove('active');
});

// Swap button
swapButton.addEventListener('click', () => {
    if (currentDirection === 'vi-en') {
        currentDirection = 'en-vi';
        enViOption.classList.add('active');
        viEnOption.classList.remove('active');
    } else {
        currentDirection = 'vi-en';
        viEnOption.classList.add('active');
        enViOption.classList.remove('active');
    }
    
    // Swap text content
    const tempText = inputText.value;
    inputText.value = outputText.value;
    outputText.value = tempText;
    
    // Update character count
    const event = new Event('input');
    inputText.dispatchEvent(event);
});

// Error handling
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// New API caller using Worker
async function sendMessage(msg) {
    try {
        const response = await fetch(workerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: msg
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data?.choices?.[0]?.message?.content || JSON.stringify(data, null, 2);
    } catch (err) {
        console.error("Error:", err);
        throw new Error(`API call failed: ${err.message}`);
    }
}

// Translation function
translateButton.addEventListener('click', async () => {
    const textToTranslate = inputText.value.trim();
    
    if (!textToTranslate) {
        showError('Please enter text you want to translate.');
        return;
    }

    if (textToTranslate.length > MAX_CHARS) {
        showError(`Text is too long. Please enter maximum ${MAX_CHARS} characters.`);
        return;
    }

    // Show loading state
    loadingSpinner.style.display = 'block';
    buttonText.textContent = 'Translating...';
    translateButton.disabled = true;
    outputText.value = '';

    let prompt = "";
    if (currentDirection === "vi-en") {
        prompt = `dịch văn bản này sang tiếng anh như người mỹ viết, dựa theo ngữ cảnh và phong cách ngôn ngữ nói chuyện thông thường và chỉ cần phản hồi kết quả: ${textToTranslate}`;
    } else {
        prompt = `dịch văn bản này sang ngôn ngữ đang trò chuyện, với kiểu dịch dự theo ngữ cảnh và cách nói chuyện hằng ngày. Chỉ cần phản hồi kết quả: ${textToTranslate}`;
    }

    try {
        let translatedText = await sendMessage(prompt);

        // Remove content inside <think></think> tags
        translatedText = (translatedText || '').replace(/<think>.*?<\/think>/gs, '');

        // Extract content inside quotes
        const quoteMatch = translatedText.match(/"([^"]*)"/);
        if (quoteMatch) {
            translatedText = quoteMatch[1];
        }

        // Clean up any extra whitespace that might be left
        translatedText = translatedText.replace(/\n\s*\n/g, '\n').trim();

        if (!translatedText) {
            showError('Unable to get translation result. Please try again.');
        }

        outputText.value = translatedText;

    } catch (error) {
        console.error('Error calling translation API:', error);
        showError(`An error occurred: ${error.message}. Please try again.`);
    } finally {
        // Reset loading state
        loadingSpinner.style.display = 'none';
        buttonText.textContent = 'Translate Now';
        translateButton.disabled = false;
    }
});

// Enter key to translate
inputText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        translateButton.click();
    }
});

// Mobile optimizations
function isMobile() {
    return window.innerWidth <= 768;
}

// Prevent zoom on double tap for mobile
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Better touch handling for buttons
if (isMobile()) {
    // Add touch feedback for buttons
    const touchButtons = [translateButton, swapButton, viEnOption, enViOption, copyButton];
    touchButtons.forEach(button => {
        button.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('touchend', function() {
            this.style.transform = '';
        });
        
        button.addEventListener('touchcancel', function() {
            this.style.transform = '';
        });
    });

    // Auto-focus input on mobile for better UX
    inputText.addEventListener('focus', function() {
        setTimeout(() => {
            this.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    });

    // Prevent textarea zoom on iOS
    inputText.addEventListener('focus', function() {
        if (isMobile()) {
            this.style.fontSize = '16px';
        }
    });

    // Optimize for mobile keyboard
    window.addEventListener('resize', function() {
        if (isMobile()) {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }
    });
}

// Handle orientation change
window.addEventListener('orientationchange', function() {
    setTimeout(() => {
        if (isMobile()) {
            inputText.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 500);
});