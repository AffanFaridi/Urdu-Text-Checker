import os
import traceback
import ollama
import difflib
import re
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()
app = FastAPI(title="Advanced Urdu Grammar Correction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Your Ollama model name - make sure this matches exactly
OLLAMA_MODEL_NAME = "urdu-model"  # Change this to your actual model name

class CorrectionRequest(BaseModel):
    text: str

def clean_model_output(raw_output: str, original_text: str) -> str:
    """Clean up model output to extract only the corrected Urdu text."""
    
    # Remove common formatting and explanation markers
    cleaned = raw_output.replace('**', '').replace('*', '').strip()
    
    # Remove common explanation phrases
    unwanted_phrases = [
        'Note:', 'note:', 'NOTE:',
        'There are no', 'there are no',
        'spelling or grammatical errors',
        'correctly states',
        'I went to school',
        'states "',
        'Explanation:',
        'The sentence is correct',
        'No corrections needed'
    ]
    
    for phrase in unwanted_phrases:
        cleaned = cleaned.replace(phrase, '')
    
    # Split by common separators and find the best Urdu line
    possible_lines = []
    
    # Try different splitting methods
    for separator in ['\n', '.', '।', 'states']:
        parts = cleaned.split(separator)
        for part in parts:
            part = part.strip()
            if len(part) > 3:  # Minimum length check
                possible_lines.append(part)
    
    # Also add the full cleaned text
    possible_lines.append(cleaned)
    
    # Find the line with the highest percentage of Urdu characters
    best_line = original_text  # Default fallback
    best_urdu_ratio = 0
    
    for line in possible_lines:
        if len(line.strip()) < 3:
            continue
            
        # Count Urdu characters (Arabic script range)
        urdu_chars = sum(1 for char in line if '\u0600' <= char <= '\u06FF' or char in ' ۔،؟')
        total_relevant_chars = len([c for c in line if c.isalpha() or c in ' ۔،؟'])
        
        if total_relevant_chars > 0:
            urdu_ratio = urdu_chars / total_relevant_chars
            
            # Prefer lines with high Urdu content and reasonable length
            if (urdu_ratio > best_urdu_ratio and 
                urdu_ratio > 0.6 and  # At least 60% Urdu
                len(line.strip()) >= len(original_text.strip()) * 0.5):  # Not too short
                best_urdu_ratio = urdu_ratio
                best_line = line.strip()
    
    # Final cleanup
    result = best_line.strip()
    result = re.sub(r'^["\'""]', '', result)  # Remove leading quotes
    result = re.sub(r'["\'""]$', '', result)  # Remove trailing quotes
    result = result.replace('"', '')  # Remove remaining quotes
    
    # If result is too different or contains too much English, return original
    english_chars = sum(1 for char in result if 'a' <= char.lower() <= 'z')
    total_alpha = sum(1 for char in result if char.isalpha())
    
    if total_alpha > 0 and english_chars / total_alpha > 0.3:  # More than 30% English
        return original_text
    
    return result if result else original_text

def get_corrected_sentence(text: str) -> str:
    """Gets the corrected sentence using the EXACT training prompt format."""
    
    try:
        # Use the EXACT same format as your training data
        prompt = f"""Below is an instruction that describes a task, paired with an input that provides further context.
Write a response that appropriately completes the request.

### Instruction:
Correct only the spelling, grammar, and context errors in the following Urdu paragraph without changing the sentence structure or writing style. Preserve the original meaning and flow.

### Input:
{text}

### Response:"""

        response = ollama.chat(
            model=OLLAMA_MODEL_NAME,
            messages=[
                {
                    'role': 'system', 
                    'content': 'You are a specialized Urdu text corrector. Respond with ONLY the corrected Urdu text. Do not add explanations, notes, English translations, or formatting. Just output the corrected Urdu sentence.'
                },
                {
                    'role': 'user', 
                    'content': prompt
                }
            ],
            stream=False,
            options={
                'temperature': 0.1,  # Very low for consistency
                'top_p': 0.8,
                'repeat_penalty': 1.1,
                'stop': ['\n\n', '**', 'Note:', 'Explanation:', 'Translation:'],
            }
        )
        
        raw_output = response['message']['content']
        cleaned_output = clean_model_output(raw_output, text)
        
        print(f"Debug - Original: {text}")
        print(f"Debug - Raw output: {raw_output}")
        print(f"Debug - Cleaned: {cleaned_output}")
        
        return cleaned_output
        
    except Exception as e:
        print(f"Error in get_corrected_sentence: {e}")
        return text  # Return original on error

def find_errors(original: str, corrected: str) -> list:
    """Compares two strings and returns a list of errors in the desired format."""
    
    if original == corrected:
        return []  # No differences found
    
    errors = []
    
    try:
        # Use word-level comparison for better accuracy
        original_words = original.split()
        corrected_words = corrected.split()
        
        matcher = difflib.SequenceMatcher(None, original_words, corrected_words)
        
        char_offset = 0  # Track character position
        
        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == 'replace':
                # Calculate the start position in the original text
                words_before = original_words[:i1]
                char_start = len(' '.join(words_before))
                if words_before:
                    char_start += 1  # Add space after previous words
                
                original_phrase = ' '.join(original_words[i1:i2])
                corrected_phrase = ' '.join(corrected_words[j1:j2])
                
                char_end = char_start + len(original_phrase)
                
                # Make sure indices are within bounds
                if char_start < len(original) and char_end <= len(original):
                    errors.append({
                        "text": original_phrase,
                        "start": char_start,
                        "end": char_end,
                        "suggestions": [corrected_phrase],
                        "reason": "Grammar/spelling correction"
                    })
            
            elif tag == 'delete':
                # Handle deletions (text removed in correction)
                words_before = original_words[:i1]
                char_start = len(' '.join(words_before))
                if words_before:
                    char_start += 1
                
                deleted_phrase = ' '.join(original_words[i1:i2])
                char_end = char_start + len(deleted_phrase)
                
                if char_start < len(original) and char_end <= len(original):
                    errors.append({
                        "text": deleted_phrase,
                        "start": char_start,
                        "end": char_end,
                        "suggestions": [""],  # Empty suggestion means deletion
                        "reason": "Unnecessary text removed"
                    })
            
            elif tag == 'insert':
                # Handle insertions (text added in correction)
                words_before = original_words[:i1]
                char_start = len(' '.join(words_before))
                if words_before:
                    char_start += 1
                
                inserted_phrase = ' '.join(corrected_words[j1:j2])
                
                # For insertions, we mark the position but with zero width
                if char_start <= len(original):
                    errors.append({
                        "text": "",  # No original text to highlight
                        "start": char_start,
                        "end": char_start,
                        "suggestions": [inserted_phrase],
                        "reason": "Missing text added"
                    })
        
    except Exception as e:
        print(f"Error in find_errors: {e}")
        # Fallback: simple character-level comparison
        if original != corrected:
            errors.append({
                "text": original,
                "start": 0,
                "end": len(original),
                "suggestions": [corrected],
                "reason": "Text correction applied"
            })
    
    return errors

@app.post("/correct_structured")
async def correct_text_structured(req: CorrectionRequest):
    """
    Receives text, identifies errors, and returns a structured list of corrections.
    """
    try:
        original_text = req.text.strip()
        
        if not original_text:
            raise HTTPException(status_code=400, detail="Empty text provided")
        
        # Step 1: Get the corrected text
        corrected_text = get_corrected_sentence(original_text)
        
        # Step 2: Find differences
        error_list = find_errors(original_text, corrected_text)
        
        # Step 3: Return structured response
        return {
            "original_text": original_text,
            "corrected_text_full": corrected_text,
            "errors": error_list
        }

    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        print(f"ERROR in correct_text_structured: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/health")
async def health():
    """Health check endpoint."""
    try:
        # Test if Ollama is responsive
        response = ollama.chat(
            model=OLLAMA_MODEL_NAME,
            messages=[{'role': 'user', 'content': 'Test'}],
            options={'temperature': 0.1}
        )
        return {
            "status": "healthy", 
            "model": OLLAMA_MODEL_NAME,
            "ollama_responsive": True
        }
    except Exception as e:
        return {
            "status": "unhealthy", 
            "model": OLLAMA_MODEL_NAME,
            "error": str(e),
            "ollama_responsive": False
        }

@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "Advanced Urdu Grammar Correction API is running",
        "model": OLLAMA_MODEL_NAME,
        "endpoints": [
            "/correct_structured - POST: Main correction endpoint",
            "/health - GET: Health check",
            "/docs - GET: API documentation"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
