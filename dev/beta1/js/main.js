// DOM Elements
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const translateButton = document.getElementById('translateButton');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const charCount = document.getElementById('charCount');
const buttonText = document.getElementById('buttonText');
const translateIcon = document.getElementById('translateIcon'); 
const swapButton = document.getElementById('swapButton');
const copyButton = document.getElementById('copyButton');
const sourceLanguageLabel = document.getElementById('sourceLanguageLabel');
const targetLanguageLabel = document.getElementById('targetLanguageLabel');

// CHANGE: New DOM elements
const sourceLanguageSelect = document.getElementById('sourceLanguageSelect');
const targetLanguageSelect = document.getElementById('targetLanguageSelect');
const sourceLanguageName = document.getElementById('sourceLanguageName');
const targetLanguageName = document.getElementById('targetLanguageName');

// CHANGE: List of languages (expandable)
const supportedLanguages = {
    'auto': 'Auto Detect',
    'vi': 'Vietnamese',
    'en': 'English',
    'zh': 'Chinese (Simplified)',
    'ja': 'Japanese',
    'ko': 'Korean',
    'fr': 'French',
    'de': 'German',
    'es': 'Spanish',
    'ru': 'Russian',
    'pt': 'Portuguese',
    'it': 'Italian',
    'hi': 'Hindi',
    'ar': 'Arabic',
    'tr': 'Turkish',
    'nl': 'Dutch',
    'pl': 'Polish',
    'sv': 'Swedish',
    'th': 'Thai',
    'id': 'Indonesian',
    'ms': 'Malay',
    'el': 'Greek',
    'cs': 'Czech',
    'da': 'Danish',
    'fi': 'Finnish',
    'hu': 'Hungarian',
    'no': 'Norwegian',
    'ro': 'Romanian',
    'sk': 'Slovak',
    'uk': 'Ukrainian',
    'he': 'Hebrew',
};


// API Key
const workerUrl = "https://cloudflare-llm.text2team.workers.dev"; 
const MAX_CHARS = 500;

// Copy functionality (Keep unchanged)
copyButton.addEventListener('click', async () => {
    const textToCopy = outputText.value.trim();
    if (!textToCopy) {
        showError('No text to copy. Please translate something first.');
        return;
    }
    try {
        await navigator.clipboard.writeText(textToCopy);
        copyButton.classList.add('copied');
        copyButton.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
        setTimeout(() => {
            copyButton.classList.remove('copied');
            copyButton.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>`;
        }, 2000);
    } catch (err) {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        copyButton.classList.add('copied');
        copyButton.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
        setTimeout(() => {
            copyButton.classList.remove('copied');
            copyButton.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>`;
        }, 2000);
    }
});

// CHANGE: Function to update labels
function updateLanguageLabels() {
    const sourceLangText = sourceLanguageSelect.options[sourceLanguageSelect.selectedIndex].text;
    const targetLangText = targetLanguageSelect.options[targetLanguageSelect.selectedIndex].text;
    
    sourceLanguageName.textContent = sourceLangText;
    targetLanguageName.textContent = targetLangText;
}

// Character counter (Keep unchanged)
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

// CHANGE: Direction selector (Using dropdowns)
sourceLanguageSelect.addEventListener('change', updateLanguageLabels);
targetLanguageSelect.addEventListener('change', updateLanguageLabels);


// CHANGE: Swap button
swapButton.addEventListener('click', () => {
    const oldSourceVal = sourceLanguageSelect.value;
    const oldTargetVal = targetLanguageSelect.value;

    // Only swap if source language is not "auto"
    if (oldSourceVal !== 'auto') {
        sourceLanguageSelect.value = oldTargetVal;
        targetLanguageSelect.value = oldSourceVal;
        
        // Update labels immediately
        updateLanguageLabels();
    
        // Swap text content
        const tempText = inputText.value;
        inputText.value = outputText.value;
        outputText.value = tempText;
        
        // Update character count
        const event = new Event('input');
        inputText.dispatchEvent(event);
    } else {
        // If 'auto', only change source language to target language
        sourceLanguageSelect.value = oldTargetVal;
        updateLanguageLabels();
    }
});

// Error handling (Keep unchanged)
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// API caller using Worker (Keep unchanged)
async function sendMessage(msg) {
    try {
        const response = await fetch(workerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: msg
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`HTTP error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const text = data?.reply?.response || data?.reply || "No response from AI";
        return text;
    } catch (err) {
        console.error("Error:", err);
        throw new Error(`API call failed: ${err.message}`);
    }
}

// CHANGE: Translation function (new prompt logic)
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
    buttonText.style.display = 'none'; 
    translateIcon.style.display = 'none'; 
    translateButton.disabled = true;
    outputText.value = '';

    // CHANGE: Dynamic prompt creation logic
    const sourceLangText = sourceLanguageSelect.value === 'auto' 
        ? 'detected language' 
        : sourceLanguageSelect.options[sourceLanguageSelect.selectedIndex].text;
    
    const targetLangText = targetLanguageSelect.options[targetLanguageSelect.selectedIndex].text;
    
    const prompt = `translate this text from ${sourceLangText} to ${targetLangText} with context-aware natural language translation style and only respond with the result, respond in that country's language, no additional explanation, only the translated text, translate: (${textToTranslate})`;

    try {
        let translatedText = await sendMessage(prompt);

        // Clean up (Keep unchanged)
        translatedText = (translatedText || '').replace(/<think>.*?<\/think>/gs, '');
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
        buttonText.style.display = 'block'; 
        translateIcon.style.display = 'block'; 
        translateButton.disabled = false;
    }
});

// Enter key to translate (Keep unchanged)
inputText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        translateButton.click();
    }
});

// Mobile optimizations (Keep unchanged)
function isMobile() {
    return window.innerWidth <= 768;
}

let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

if (isMobile()) {
    // CHANGE: Update touch button list
    const touchButtons = [translateButton, swapButton, copyButton]; // Remove 2 old buttons
    touchButtons.forEach(button => {
        button.addEventListener('touchstart', function(e) {
            e.preventDefault(); 
            this.style.transform = 'scale(0.98)';
        }, { passive: false });
        
        button.addEventListener('touchend', function() {
            this.style.transform = '';
            this.click(); 
        });
        
        button.addEventListener('touchcancel', function() {
            this.style.transform = '';
        });
    });

    inputText.addEventListener('focus', function() {
        setTimeout(() => {
            window.scrollTo(0, 0); 
        }, 300);
    });

    inputText.addEventListener('focus', function() {
        if (isMobile()) {
            this.style.fontSize = '16px';
        }
    });
}

// Function to set --vh (Keep unchanged)
function setVh() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', setVh);
window.addEventListener('orientationchange', setVh);

// CHANGE: Function to initialize dropdowns
function initializeLanguageSelects() {
    const sourceFragment = document.createDocumentFragment();
    const targetFragment = document.createDocumentFragment();

    for (const [code, name] of Object.entries(supportedLanguages)) {
        // Source (has 'auto')
        const sourceOption = document.createElement('option');
        sourceOption.value = code;
        sourceOption.textContent = name;
        sourceFragment.appendChild(sourceOption);

        // Target (no 'auto')
        if (code !== 'auto') {
            const targetOption = document.createElement('option');
            targetOption.value = code;
            targetOption.textContent = name;
            targetFragment.appendChild(targetOption);
        }
    }

    sourceLanguageSelect.appendChild(sourceFragment);
    targetLanguageSelect.appendChild(targetFragment);

    // Set defaults
    sourceLanguageSelect.value = 'vi';
    targetLanguageSelect.value = 'en';

    // Update labels for the first time
    updateLanguageLabels();
}

// Call initialization function when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeLanguageSelects();
    setVh();
});

