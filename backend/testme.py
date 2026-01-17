from fastapi import FastAPI

rk = FastAPI()

@rk.get("/")
def home():
    return {"message": "Je suis Happy"}

@rk.get("/moi")
def moi():
    return {"message": "Je suis Happy, votre Ir fullstack developer"}