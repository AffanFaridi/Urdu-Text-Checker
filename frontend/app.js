// Global variables
let currentErrors = [];
let currentErrorIndex = -1;

// DOM Elements
const inputTextarea = document.getElementById('input');
const checkBtn = document.getElementById('checkBtn');
const clearBtn = document.getElementById('clearBtn');
const charCount = document.getElementById('char-count');
const resultsSection = document.getElementById('results-section');
const highlightedOutput = document.getElementById('highlighted-output');
const correctedOutput = document.getElementById('corrected-output');
const errorCountElement = document.getElementById('error-count');
const suggestionsPanel = document.getElementById('suggestions-panel');

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateCharCount();
});

function initializeEventListeners() {
    // Character counter
    inputTextarea.addEventListener('input', updateCharCount);
    
    // Clear button
    clearBtn.addEventListener('click', clearInput);
    
    // Check button
    checkBtn.addEventListener('click', checkGrammar);
    
    // View toggle buttons
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', toggleView);
    });
    
    // Suggestions panel
    document.querySelector('.close-panel').addEventListener('click', closeSuggestionsPanel);
    document.getElementById('apply-suggestion').addEventListener('click', applySuggestion);
    document.getElementById('ignore-suggestion').addEventListener('click', ignoreSuggestion);
    
    // Close panel on outside click
    document.addEventListener('click', function(e) {
        if (e.target === suggestionsPanel) {
            closeSuggestionsPanel();
        }
    });
}

function updateCharCount() {
    const count = inputTextarea.value.length;
    charCount.textContent = count;
    
    // Change color based on limit
    if (count > 800) {
        charCount.style.color = 'var(--error-color)';
    } else if (count > 600) {
        charCount.style.color = 'var(--warning-color)';
    } else {
        charCount.style.color = 'var(--text-secondary)';
    }
}

function clearInput() {
    inputTextarea.value = '';
    updateCharCount();
    hideResults();
    
    // Add animation
    inputTextarea.style.transform = 'scale(0.98)';
    setTimeout(() => {
        inputTextarea.style.transform = 'scale(1)';
    }, 150);
}

function showLoading(show) {
    if (show) {
        checkBtn.classList.add('loading');
        checkBtn.disabled = true;
    } else {
        checkBtn.classList.remove('loading');
        checkBtn.disabled = false;
    }
}

async function checkGrammar() {
    const text = inputTextarea.value.trim();
    
    if (!text) {
        showToast('براہ کرم پہلے کچھ متن درج کریں', 'warning');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch('http://127.0.0.1:8000/correct_structured', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text })
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        displayResults(data);
        
    } catch (error) {
        console.error('Grammar check failed:', error);
        showToast('Error connecting to server. Please check if backend is running.', 'error');
    } finally {
        showLoading(false);
    }
}

function displayResults(data) {
    currentErrors = data.errors || [];
    
    // Update error count
    const errorCount = currentErrors.length;
    errorCountElement.textContent = errorCount === 0 ? 'No errors found' : 
        `${errorCount} error${errorCount > 1 ? 's' : ''} found`;
    
    // Display highlighted text
    renderHighlightedText(data);
    
    // Display corrected text
    correctedOutput.innerHTML = `<div class="corrected-text">${data.corrected_text_full || data.original_text}</div>`;
    
    // Show results section with animation
    showResults();
}

function renderHighlightedText(data) {
    const container = highlightedOutput;
    container.innerHTML = '';
    
    if (currentErrors.length === 0) {
        container.innerHTML = `<div class="no-errors">
            <i class="fas fa-check-circle" style="color: var(--success-color); font-size: 2rem; margin-bottom: 1rem;"></i>
            <p>Great! No errors found in your text.</p>
            <div class="original-text-display">${data.original_text}</div>
        </div>`;
        return;
    }
    
    // Sort errors by position
    const sortedErrors = [...currentErrors].sort((a, b) => a.start - b.start);
    let lastIndex = 0;
    
    sortedErrors.forEach((error, index) => {
        // Add text before error
        if (error.start > lastIndex) {
            const textNode = document.createTextNode(data.original_text.substring(lastIndex, error.start));
            container.appendChild(textNode);
        }
        
        // Create error highlight
        const errorSpan = document.createElement('mark');
        errorSpan.className = 'error-highlight';
        errorSpan.textContent = data.original_text.substring(error.start, error.end);
        errorSpan.setAttribute('data-error-index', index);
        
        // Add click event
        errorSpan.addEventListener('click', (e) => {
            e.stopPropagation();
            showSuggestionPanel(error, index, errorSpan);
        });
        
        container.appendChild(errorSpan);
        lastIndex = error.end;
    });
    
    // Add remaining text
    if (lastIndex < data.original_text.length) {
        const textNode = document.createTextNode(data.original_text.substring(lastIndex));
        container.appendChild(textNode);
    }
}

function showSuggestionPanel(error, index, element) {
    currentErrorIndex = index;
    
    document.getElementById('original-word').textContent = error.text;
    document.getElementById('suggested-word').textContent = error.suggestions[0];
    
    suggestionsPanel.style.display = 'block';
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'backdrop';
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999;
        animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(backdrop);
    
    backdrop.addEventListener('click', closeSuggestionsPanel);
}

function closeSuggestionsPanel() {
    suggestionsPanel.style.display = 'none';
    const backdrop = document.querySelector('.backdrop');
    if (backdrop) {
        backdrop.remove();
    }
    currentErrorIndex = -1;
}

function applySuggestion() {
    if (currentErrorIndex === -1) return;
    
    const error = currentErrors[currentErrorIndex];
    const suggestion = error.suggestions[0];
    
    // Find and replace the error element
    const errorElement = document.querySelector(`[data-error-index="${currentErrorIndex}"]`);
    if (errorElement) {
        const correctedSpan = document.createElement('span');
        correctedSpan.textContent = suggestion;
        correctedSpan.className = 'corrected-text-inline';
        correctedSpan.style.cssText = `
            background: rgba(16, 185, 129, 0.1);
            padding: 2px 4px;
            border-radius: 4px;
            animation: correctApplied 0.5s ease;
        `;
        
        errorElement.parentNode.replaceChild(correctedSpan, errorElement);
        
        // Update error count
        currentErrors.splice(currentErrorIndex, 1);
        updateErrorCount();
    }
    
    closeSuggestionsPanel();
    showToast('Correction applied successfully!', 'success');
}

function ignoreSuggestion() {
    if (currentErrorIndex === -1) return;
    
    const errorElement = document.querySelector(`[data-error-index="${currentErrorIndex}"]`);
    if (errorElement) {
        errorElement.style.background = 'rgba(100, 116, 139, 0.1)';
        errorElement.style.borderBottom = '2px solid var(--secondary-color)';
        errorElement.classList.add('ignored');
    }
    
    closeSuggestionsPanel();
    showToast('Suggestion ignored', 'info');
}

function updateErrorCount() {
    const activeErrors = currentErrors.length;
    errorCountElement.textContent = activeErrors === 0 ? 'All errors resolved!' : 
        `${activeErrors} error${activeErrors > 1 ? 's' : ''} remaining`;
}

function toggleView(e) {
    const viewType = e.target.getAttribute('data-view');
    
    // Update active button
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    // Toggle views
    if (viewType === 'highlighted') {
        highlightedOutput.style.display = 'block';
        correctedOutput.style.display = 'none';
    } else {
        highlightedOutput.style.display = 'none';
        correctedOutput.style.display = 'block';
    }
}

function showResults() {
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideResults() {
    resultsSection.style.display = 'none';
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? 'var(--success-color)' : 
                     type === 'error' ? 'var(--error-color)' : 
                     type === 'warning' ? 'var(--warning-color)' : 'var(--primary-color)'};
        color: white;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        z-index: 2000;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
        font-weight: 500;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes correctApplied {
        0% { background: rgba(16, 185, 129, 0.3); transform: scale(1.05); }
        100% { background: rgba(16, 185, 129, 0.1); transform: scale(1); }
    }
    
    .no-errors {
        text-align: center;
        padding: 3rem;
        color: var(--text-secondary);
    }
    
    .original-text-display {
        font-family: 'Noto Nastaliq Urdu', serif;
        font-size: 1.2rem;
        margin-top: 2rem;
        padding: 1.5rem;
        background: rgba(16, 185, 129, 0.05);
        border-radius: var(--radius-md);
        direction: rtl;
        text-align: right;
    }
    
    .corrected-text {
        font-family: 'Noto Nastaliq Urdu', serif;
        font-size: 1.3rem;
        line-height: 2;
        direction: rtl;
        text-align: right;
    }
`;
document.head.appendChild(style);
