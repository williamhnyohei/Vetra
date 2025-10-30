import os
from dotenv import load_dotenv 
import logging 

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
MULTI_AGENT_API_KEY = os.getenv("MULTI_AGENT_API_KEY", "dev-key")

DEFAULT_WEIGHTS = {
    "phishing": 0.95,
    "transaction": 0.75,
    "rugpull": 0.85,
}

OVERRIDES = [
    ("phishing", 0.90, 0.98),
    ("rugpull", 0.90, 0.95),
    ("transaction", 0.90, 0.95),
]