
from fastapi import FastAPI, Query

app = FastAPI()

# Real-time doctor finder: calls Node.js backend and returns doctor profiles
@app.get("/find-doctors")
async def find_doctors(city: str = Query(None), specialty: str = Query(None), name: str = Query(None)):
    params = {}
    if city:
        params['city'] = city
    if specialty:
        params['specialty'] = specialty
    if name:
        params['name'] = name
    try:
        resp = requests.get("http://localhost:5000/api/doctors/search", params=params, timeout=10)
        resp.raise_for_status()
        return {"doctors": resp.json()}
    except Exception as e:
        return {"error": str(e)}

from dotenv import load_dotenv
load_dotenv()
from pydantic import BaseModel
from langchain.agents import initialize_agent, Tool
from langchain_google_genai import ChatGoogleGenerativeAI
import requests
import os

# Tool: Symptom analysis
def symptom_tool(symptoms: str):
    symptoms = symptoms.lower()
    if any(s in symptoms for s in ["fever", "cold", "headache", "stomach pain"]):
        return "You may need to consult a General Physician."
    if "skin" in symptoms or "rash" in symptoms:
        return "You may need to consult a Dermatologist."
    if "tooth" in symptoms or "teeth" in symptoms:
        return "You may need to consult a Dentist."
    return "Please provide more details about your symptoms."

# Tool: Doctor finder (calls Node.js API)
def doctor_finder_tool(city: str, specialty: str):
    try:
        url = f"http://localhost:5000/api/doctors?city={city}&specialty={specialty}"
        response = requests.get(url)
        doctors = response.json()
        if not doctors:
            return f"No doctors found for {specialty} in {city}."
        return "Doctors found: " + ", ".join([doc['name'] for doc in doctors])
    except Exception as e:
        return f"Error finding doctors: {str(e)}"

tools = [
    Tool(name="SymptomChecker", func=symptom_tool, description="Suggests possible conditions/advice based on symptoms."),
    Tool(name="DoctorFinder", func=doctor_finder_tool, description="Finds doctors by city and specialty.")
]

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    user_message = request.message
    # Simple keyword-based extraction for city and specialty
    import re
    city_match = re.search(r'in ([a-zA-Z ]+)', user_message, re.I)
    city = city_match.group(1).strip() if city_match else None
    specialties = ["General Physician", "Cardiologist", "Dentist", "Orthopedic", "Dermatologist", "Neurologist", "Pediatrician", "Gynecologist", "ENT", "Psychiatrist", "Oncologist", "Urologist", "Nephrologist", "Gastroenterologist", "Pulmonologist", "Ophthalmologist"]
    specialty = None
    for spec in specialties:
        if spec.lower() in user_message.lower():
            specialty = spec
            break
    # If user asks for doctor, fetch real-time doctor profiles
    if 'doctor' in user_message.lower() or specialty or city:
        params = {}
        if city:
            params['city'] = city
        if specialty:
            params['specialty'] = specialty
        try:
            resp = requests.get("http://localhost:5000/api/doctors/search", params=params, timeout=10)
            resp.raise_for_status()
            doctors = resp.json()
            if doctors:
                return {"answer": f"Here are some {specialty or 'doctors'}{f' in {city}' if city else ''}:", "doctors": doctors}
            else:
                return {"answer": f"No doctors found for {specialty or 'your query'}{f' in {city}' if city else ''}."}
        except Exception as e:
            return {"answer": f"Error finding doctors: {str(e)}"}
    # Otherwise, fallback to LLM
    gemma_api_key = os.getenv("GEMINI_API_KEY")
    if not gemma_api_key:
        return {"answer": "Gemma API key missing. Set GEMINI_API_KEY in your environment."}
    gemma_api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemma-3n-e4b-it:generateContent?key={gemma_api_key}"
    prompt = f"You are a helpful health assistant. Your job is to help users find doctors.\n\nIf the user mentions a symptom like 'fever', 'headache', 'cold', 'stomach pain', infer that they need a 'General Physician'.\n\nUser's message: '{user_message}'\n\nGive a short helpful reply or suggest a doctor type they should search."
    payload = {
        "contents": [{
            "role": "user",
            "parts": [{"text": prompt}]
        }]
    }
    try:
        response = requests.post(gemma_api_url, json=payload)
        data = response.json()
        ai_response = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        return {"answer": ai_response.strip() if ai_response else "Sorry, I couldn't understand your request."}
    except Exception as e:
        return {"answer": f"Error: {str(e)}"}
