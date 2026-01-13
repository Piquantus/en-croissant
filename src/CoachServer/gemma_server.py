from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

app = FastAPI()

# CORS pour Tauri / Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Charger le modèle UNE FOIS
model_name = "NAKSTStudio/chess-gemma-commentary"
model = AutoModelForCausalLM.from_pretrained(model_name)
tokenizer = AutoTokenizer.from_pretrained(model_name)

class MoveRequest(BaseModel):
    fen: str
    move: str
    side: str
    best_alt: str
    cp_before: int
    cp_after: int
    tag: str

@app.post("/gemma")
def generate_feedback(req: MoveRequest):
    delta_cp = req.cp_after - req.cp_before

    # Construct the chat-style prompt
    messages = [
        {
            'role': 'system',
            'content': (
                "Generate professional chess commentary in the specified language. "
                "For Type=standard use 10–20 words. For Type=explanation, explain the best move briefly (≤20 words). "
                "Return exactly: Commentary."
            )
        },
        {
            'role': 'user',
            'content': f"""LanguageL: English
            LangCode: en
            Type: standard
            FEN: {req.fen}
            MoveSAN: {req.move}
            Side: {req.side}
            Actor: human
            Gender: neutral
            Tag: {req.tag}
            BestAlt: {req.best_alt}
            CP: {req.cp_before}->{req.cp_after} (Δ={delta_cp})"""
        }
    ]

    # Tokenize with chat template
    inputs = tokenizer.apply_chat_template(
        messages,
        return_tensors="pt",
        add_generation_prompt=True
    )

    # Ensure inputs is a dictionary for **kwargs
    if isinstance(inputs, torch.Tensor):
        inputs = {"input_ids": inputs}

    # Generate output
    outputs = model.generate(**inputs, max_new_tokens=128)

    # Decode to readable text
    decoded = tokenizer.decode(outputs[0], skip_special_tokens=True)

    # Extract only the commentary (last line)
    lines = decoded.strip().splitlines()
    commentary = lines[-1].strip() if lines else decoded.strip()

    return {"feedback": commentary}
