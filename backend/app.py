from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
from google import genai
import os
from dotenv import load_dotenv
import logging
from typing import List, Dict, Any, Optional

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Gemini client
try:
    client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))
except Exception as e:
    logger.error(f"Failed to initialize Gemini client: {e}")
    raise

class WebContentAnalyzer:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })

    def fetch_content(self, url: str) -> Optional[str]:
        """Fetch and extract main content from a URL."""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove unwanted elements
            for element in soup(['script', 'style', 'nav', 'footer', 'header']):
                element.decompose()
            
            # Extract text content
            text = ' '.join(soup.stripped_strings)
            return text
        except Exception as e:
            logger.error(f"Error fetching content from {url}: {e}")
            return None

    def analyze_content(self, urls: List[str], question: str) -> Dict[str, Any]:
        """Analyze content from multiple URLs and generate an answer."""
        try:
            # Fetch content from all URLs
            contents = []
            for url in urls:
                content = self.fetch_content(url)
                if content:
                    contents.append(f"Content from {url}:\n{content}")

            if not contents:
                return {"error": "Could not fetch content from any of the provided URLs"}

            # Combine all contents and create prompt
            combined_content = "\n\n".join(contents)
            prompt = f"""Based on the following web content, please answer this question: {question}

Web Content:
{combined_content}

Please provide a clear and concise answer based only on the information provided in the web content."""

            # Generate response using Gemini
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )

            return {"answer": response.text}

        except Exception as e:
            logger.error(f"Error analyzing content: {e}")
            return {"error": f"Analysis failed: {str(e)}"}

# Initialize analyzer
analyzer = WebContentAnalyzer()

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """Endpoint to analyze web content and answer questions."""
    try:
        data = request.get_json()
        
        # Validate input
        if not data or 'urls' not in data or 'question' not in data:
            return jsonify({
                "error": "Missing required fields: urls and question"
            }), 400

        urls = data['urls']
        question = data['question']

        # Validate URLs
        if not urls or not isinstance(urls, list):
            return jsonify({
                "error": "URLs must be provided as a non-empty list"
            }), 400

        # Validate question
        if not question or not isinstance(question, str):
            return jsonify({
                "error": "Question must be provided as a non-empty string"
            }), 400

        # Analyze content and generate response
        result = analyzer.analyze_content(urls, question)

        if "error" in result:
            return jsonify(result), 500

        return jsonify(result)

    except Exception as e:
        logger.error(f"Error processing request: {e}")
        return jsonify({
            "error": "An unexpected error occurred"
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port)