# 🔤 Urdu Text Checker

An AI-powered web application for checking and correcting Urdu text grammar, spelling, and contextual errors. Built with a custom-trained Gemma 2 model fine-tuned specifically for Urdu language correction.

## 🌟 Features

- **Real-time Grammar Correction**: Identifies and corrects spelling, grammar, and contextual errors in Urdu text
- **Interactive Error Highlighting**: Click on highlighted errors to see suggestions and corrections
- **Character Counter**: Keep track of text length with color-coded indicators
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Clean Interface**: Modern, user-friendly design optimized for Urdu text input

## 🏗️ Architecture

### Frontend
- **HTML5/CSS3/JavaScript**: Modern web technologies for responsive UI
- **Noto Nastaliq Urdu Font**: Proper Urdu text rendering
- **Real-time API Integration**: Instant grammar checking with visual feedback

### Backend
- **FastAPI**: High-performance Python web framework
- **Ollama Integration**: Local LLM inference engine
- **Custom Gemma 2 Model**: Fine-tuned specifically for Urdu grammar correction
- **CORS Support**: Cross-origin requests enabled for frontend integration

### AI Model
- **Base Model**: Google's Gemma 2
- **Fine-tuning**: Custom training on Urdu grammar correction dataset
- **Training Framework**: Unsloth for efficient fine-tuning
- **Format**: GGUF for optimized local inference with Ollama

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Ollama installed locally
- Git

### Installation

1.  **Clone the repository**
    ```
    git clone https://github.com/AffanFaridi/Urdu-Text-Checker.git
    cd Urdu-Text-Checker
    ```

2.  **Install Ollama and setup your model**
    ```
    # Install Ollama (visit https://ollama.ai for installation)
    
    # Create your custom Urdu model in Ollama
    # Make sure your model is named 'urdu-model' or update OLLAMA_MODEL_NAME in main.py
    ```

3.  **Set up the backend**
    ```
    cd backend
    pip install -r requirements.txt
    ```

4.  **Run the application**
    ```
    # Start the backend server from the 'backend' directory
    uvicorn main:app --reload
    
    # Open index.html in your browser or serve with a local server from the 'frontend' directory
    # For development: python -m http.server 8080
    ```

### Usage

1.  Open the web application in your browser
2.  Enter Urdu text in the input textarea
3.  Click "Check Grammar" to analyze the text
4.  Review highlighted errors and click on them to see suggestions
5.  Apply corrections or ignore suggestions as needed

## 🤖 Model Training Process

### 1. Data Preparation & Training (Kaggle)
The model was trained using Unsloth on Kaggle for efficient fine-tuning:

📓 **[Kaggle Training Notebook](https://www.kaggle.com/code/affanwaqarfaridi/notebooka30fadd336)**
- Fine-tuned Gemma 2 model on Urdu grammar correction dataset
- Used Unsloth for 4x faster training with lower memory usage
- Trained with instruction-following format for grammar correction tasks

### 2. Model Conversion (Google Colab)
Due to storage limitations on Kaggle, model conversion was performed on Google Colab:

📓 **[Colab Conversion Notebook](https://colab.research.google.com/drive/1Ca8rsET5BUpJUdpvEA1uuRjQ9xcOD_3S?usp=sharing)**
- Converted fine-tuned model to GGUF format
- Optimized for local inference with Ollama
- Uploaded to Hugging Face for distribution

### 3. Local Deployment
- Downloaded GGUF model locally
- Integrated with Ollama for efficient inference
- Connected to FastAPI backend for web application

## 📁 Project Structure

```
urdu-grammar-checker/
├── frontend/
│   ├── index.html          # Main HTML file
│   ├── style.css           # Styling and responsive design
│   └── app.js              # Frontend JavaScript logic
├── backend/
│   └── main.py             # FastAPI server and API endpoints
├── notebooks/
│   ├── training.md         # Link to Kaggle training notebook
│   └── conversion.md       # Link to Colab conversion notebook
└── README.md               # Project documentation
```



## 🔧 API Endpoints

### `POST /correct_structured`
Analyzes and corrects Urdu text, returning structured error information.

**Request Body:**
```json
{
  "text": "Your Urdu text here"
}
```


**Response:**
```json
{
  "original_text": "Original input text",
  "corrected_text_full": "Fully corrected text",
  "errors": [
    {
      "text": "Error text",
      "start": 0,
      "end": 5,
      "suggestions": ["Correction suggestion"],
      "reason": "Grammar/spelling correction"
    }
  ]
}
```



### `GET /health`
Health check endpoint to verify API and model status.

### `GET /`
Root endpoint with API information and available endpoints.

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript, Noto Nastaliq Urdu Font
- **Backend**: Python, FastAPI, Ollama, Pydantic
- **AI/ML**: Gemma 2, Unsloth, Hugging Face Transformers
- **Deployment**: Local inference with Ollama, GGUF model format
- **Development**: Kaggle (training), Google Colab (conversion), Git

## 📚 Training Notebooks

- **[Training Notebook (Kaggle)](https://www.kaggle.com/code/affanwaqarfaridi/notebooka30fadd336)**: Complete model fine-tuning process using Unsloth
- **[Conversion Notebook (Colab)](https://colab.research.google.com/drive/1Ca8rsET5BUpJUdpvEA1uuRjQ9xcOD_3S?usp=sharing)**: Model conversion to GGUF format for Ollama

## ⚙️ Configuration

The backend uses a simple configuration in `main.py`:
- Update `OLLAMA_MODEL_NAME` to match your model name in Ollama
- Default model name is set to `"urdu-model"`
- No additional configuration files required

## 🤝 Contributing

1.  Fork the repository
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Affan Faridi**
- GitHub: [@AffanFaridi](https://github.com/AffanFaridi)

## 🙏 Acknowledgments

- Google for the Gemma 2 base model
- Unsloth team for efficient fine-tuning framework
- Ollama for local LLM inference
- The open-source community for tools and libraries used

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub or contact the maintainer.

---

<div align="center">
  <p>Made with ❤️ for the Urdu language community</p>
</div>


