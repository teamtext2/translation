    // --- CONSTANTS & CONFIG ---
    const workerUrl = "https://cloudflare-llm.text2team.workers.dev"; 
    const MAX_CHARS = 500;
    const supportedLanguages = {
        'auto': 'Auto Detect',
        'vi': 'Vietnamese',
        'en': 'English',
        'zh': 'Chinese',
        'ja': 'Japanese',
        'ko': 'Korean',
        'fr': 'French',
        'de': 'German',
        'es': 'Spanish',
        'ru': 'Russian',
        'th': 'Thai',
        'id': 'Indonesian',
    };

    // --- DOM ELEMENTS ---
    const elements = {
        input: document.getElementById('inputText'),
        output: document.getElementById('outputText'),
        btnTranslate: document.getElementById('translateButton'),
        btnSwap: document.getElementById('swapButton'),
        btnCopy: document.getElementById('copyButton'),
        btnClear: document.getElementById('clearButton'),
        selectSource: document.getElementById('sourceLanguageSelect'),
        selectTarget: document.getElementById('targetLanguageSelect'),
        displaySource: document.getElementById('sourceLangDisplay'),
        displayTarget: document.getElementById('targetLangDisplay'),
        charCount: document.getElementById('charCount'),
        spinner: document.getElementById('loadingSpinner'),
        btnText: document.getElementById('buttonText'),
        btnIcon: document.getElementById('buttonIcon'),
        errorMsg: document.getElementById('errorMessage'),
    };

    // --- INITIALIZATION ---
    function init() {
        // Populate Selects
        populateSelect(elements.selectSource, true);
        populateSelect(elements.selectTarget, false);
        
        // Set Defaults
        elements.selectSource.value = 'vi';
        elements.selectTarget.value = 'en';
        updateDisplays();

        // Add Event Listeners
        setupListeners();
        
        // Mobile viewport fix
        setAppHeight();
        window.addEventListener('resize', setAppHeight);
    }

    function populateSelect(selectElement, includeAuto) {
        const fragment = document.createDocumentFragment();
        for (const [code, name] of Object.entries(supportedLanguages)) {
            if (!includeAuto && code === 'auto') continue;
            const option = document.createElement('option');
            option.value = code;
            option.textContent = name;
            fragment.appendChild(option);
        }
        selectElement.appendChild(fragment);
    }

    function setupListeners() {
        // Language Changes
        elements.selectSource.addEventListener('change', updateDisplays);
        elements.selectTarget.addEventListener('change', updateDisplays);

        // Swap
        elements.btnSwap.addEventListener('click', handleSwap);

        // Text Input
        elements.input.addEventListener('input', handleInput);
        
        // Clear
        elements.btnClear.addEventListener('click', () => {
            elements.input.value = '';
            elements.output.value = '';
            handleInput();
            elements.input.focus();
        });

        // Copy
        elements.btnCopy.addEventListener('click', handleCopy);

        // Translate Action
        elements.btnTranslate.addEventListener('click', handleTranslate);
        
        // Ctrl+Enter Shortcut
        elements.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                elements.btnTranslate.click();
            }
        });
    }

    // --- LOGIC FUNCTIONS ---

    function setAppHeight() {
        document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    }

    function updateDisplays() {
        const sText = elements.selectSource.options[elements.selectSource.selectedIndex].text;
        const tText = elements.selectTarget.options[elements.selectTarget.selectedIndex].text;
        
        elements.displaySource.textContent = sText;
        elements.displayTarget.textContent = tText;
    }

    function handleSwap() {
        const oldSource = elements.selectSource.value;
        const oldTarget = elements.selectTarget.value;

        // Animation for swap button
        elements.btnSwap.style.transform = 'rotate(180deg)';
        setTimeout(() => elements.btnSwap.style.transform = 'rotate(0deg)', 300);

        if (oldSource !== 'auto') {
            elements.selectSource.value = oldTarget;
            elements.selectTarget.value = oldSource;
            
            // Swap content
            const tempText = elements.input.value;
            elements.input.value = elements.output.value;
            elements.output.value = tempText;
            
            handleInput(); // Update char count
        } else {
            // If auto, just set source to target's value
            elements.selectSource.value = oldTarget;
        }
        updateDisplays();
    }

    function handleInput() {
        const len = elements.input.value.length;
        elements.charCount.textContent = `${len}/${MAX_CHARS}`;
        
        // Toggle Clear Button
        elements.btnClear.style.display = len > 0 ? 'block' : 'none';

        // Validation Visuals
        if (len > MAX_CHARS) {
            elements.charCount.classList.add('text-red-500');
            elements.input.value = elements.input.value.substring(0, MAX_CHARS);
        } else {
            elements.charCount.classList.remove('text-red-500');
        }
    }

    async function handleCopy() {
        const text = elements.output.value;
        if (!text) return showError("Nothing to copy!");
        
        try {
            await navigator.clipboard.writeText(text);
            const originalIcon = elements.btnCopy.innerHTML;
            // Success Icon (Checkmark)
            elements.btnCopy.innerHTML = `<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
            elements.btnCopy.classList.add('bg-green-500/10', 'border-green-500/50');
            
            setTimeout(() => {
                elements.btnCopy.innerHTML = originalIcon;
                elements.btnCopy.classList.remove('bg-green-500/10', 'border-green-500/50');
            }, 1500);
        } catch (err) {
            showError("Failed to copy");
        }
    }

    function showError(msg) {
        elements.errorMsg.textContent = msg;
        elements.errorMsg.classList.remove('hidden');
        elements.errorMsg.style.opacity = '1';
        setTimeout(() => {
            elements.errorMsg.style.opacity = '0';
            setTimeout(() => elements.errorMsg.classList.add('hidden'), 300);
        }, 3000);
    }

    function toggleLoading(isLoading) {
        elements.btnTranslate.disabled = isLoading;
        if (isLoading) {
            elements.spinner.style.display = 'block';
            elements.btnText.style.display = 'none';
            elements.btnIcon.style.display = 'none';
            elements.btnTranslate.classList.add('opacity-80', 'cursor-wait');
        } else {
            elements.spinner.style.display = 'none';
            elements.btnText.style.display = 'block';
            elements.btnIcon.style.display = 'block';
            elements.btnTranslate.classList.remove('opacity-80', 'cursor-wait');
        }
    }

    // --- API LOGIC ---
    async function handleTranslate() {
        const text = elements.input.value.trim();
        if (!text) return showError("Please enter some text");
        
        // Dismiss Keyboard on Mobile
        elements.input.blur();

        toggleLoading(true);
        elements.output.value = '';

        const sText = elements.selectSource.value === 'auto' 
            ? 'detected language' 
            : elements.selectSource.options[elements.selectSource.selectedIndex].text;
        const tText = elements.selectTarget.options[elements.selectTarget.selectedIndex].text;

        const prompt = `translate this text from ${sText} to ${tText} with context-aware natural language translation style and only respond with the result, respond in that country's language, no additional explanation, only the translated text, translate: (${text})`;

        try {
            const response = await fetch(workerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            });

            if (!response.ok) throw new Error("Network response was not ok");

            const data = await response.json();
            let translatedText = data?.reply?.response || data?.reply || "Translation failed";
            
            // Cleanup think tags if any
            translatedText = translatedText.replace(/<think>.*?<\/think>/gs, '').trim();
            
            elements.output.value = translatedText;

        } catch (error) {
            console.error(error);
            showError("Connection failed. Try again.");
        } finally {
            toggleLoading(false);
        }
    }

    // Run Init
    document.addEventListener('DOMContentLoaded', init);