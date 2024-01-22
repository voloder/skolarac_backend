import asyncio
import json
from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.staticfiles import StaticFiles
import socketio

from models import *
import random
from typing import List

app = FastAPI()

static_files = {
    "/static": "./static",
    "/":  "./static/index.html",
}

sio = socketio.AsyncServer(async_mode="asgi")

sobe = []

@app.post("/sobe/udji/")
async def udji(kod : str, igrac : Igrac) -> Soba:
    for soba in sobe:
        if soba.kod == kod:
            soba.ucesnici.append(igrac)
            await sio.emit("soba_" + soba.kod, soba.model_dump_json())
            return soba
    raise HTTPException(status_code=404, detail="Soba ne postoji")

@app.get("/sobe/kreiraj/")
async def kreiraj() -> str:
    kod = str(random.randint(1000, 9999))
    soba = Soba(kod=kod, igraci=[])
    sobe.append(soba)
    asyncio.create_task(cisti(soba))
    return kod

@app.post("/sobe/zapocni/")
async def zapocni(kod : str):
    soba = nadji_sobu(kod)
    asyncio.create_task(zapocni_sobu(soba))
    return 200


@sio.on('*')
async def odabir(event : str, sid : str, data : str):
    if(not event.startswith("odabir_")):
        return
    
    #data = json.loads(data)
    
    kod = event.replace("odabir_", "")
    soba = nadji_sobu(kod)
    
    igrac = soba.nadji_igraca(data["igrac"]["ime"], data["igrac"]["avatar"])
    
    igrac.odabir = data["odgovor"]
    

async def update_sobu(soba : Soba):
    await sio.emit("soba_" + soba.kod, soba.model_dump_json())
    
async def odbroji(soba : Soba, vrjeme : int):
    for t in range(vrjeme, 0, -1):
        soba.countdown = t
        await asyncio.gather( # obe async funkcije paralelno, da ne bi došlo do usporavanja countdowna zbog cekanja na socketio
            update_sobu(soba),
            asyncio.sleep(1)
        )
        
async def zapocni_sobu(soba : Soba):
    soba.stanje = "countdown"
        
    await odbroji(soba, 3)
     
    pitanja = ucitaj_pitanja()
    
    for i in range(2):
        soba.pitanje = pitanja[i]
        
        soba.stanje = "pitanje"
        await odbroji(soba, soba.vrijeme_pitanja)
        
        for igrac in soba.igraci:
            if(["a", "b", "c", "d"][igrac.odabir] == soba.pitanje.tacan):
                igrac.poeni += 5
        
        soba.stanje = "otkrij"
        await odbroji(soba, soba.vrijeme_otkrivanja)
    
    soba.stanje = "zavrseno"
    await update_sobu(soba)
    sobe.remove(soba)


def ucitaj_pitanja() -> List[Pitanje]:
    f = open("pitanja.json")
    pitanja = []
    for pitanje in json.load(f)["pitanja"]:
        pitanja.append(Pitanje(pitanje=pitanje["pitanje"],
                               a=pitanje["a"], 
                               b=pitanje["b"],
                               c=pitanje["c"], 
                               d=pitanje["d"], 
                               tacan=pitanje["tacan"]
                               ))
    f.close()
    random.shuffle(pitanja)
    return pitanja

def nadji_sobu(kod : str) -> Soba:
    return [soba for soba in sobe if soba.kod == kod][0]
        
async def cisti(soba : Soba): # ova funkcija brise sobu ako nije zapoceta 10 minuta od stvaranja
    await asyncio.sleep(600)
    if(soba.stanje == "cekanje"):
        sobe.remove(soba)

app.mount("/", socketio.ASGIApp(sio, static_files=static_files))
