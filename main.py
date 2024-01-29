import asyncio
import json
from fastapi import FastAPI, HTTPException
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

sobe: List[Soba] = []

@app.post("/sobe/udji/")
async def udji(kod : str, igrac : Igrac) -> Soba:
    for soba in sobe:
        if soba.kod == kod:
            if igrac not in soba.igraci:
                soba.igraci.append(igrac)
            await update_sobu(soba)
            return soba
    raise HTTPException(status_code=404, detail="Soba ne postoji")

@app.post("/sobe/kreiraj/")
async def kreiraj() -> str:

    kod = str(random.randint(1000, 9999))
    soba = Soba(kod=kod, igraci=[])
    sobe.append(soba)
    asyncio.create_task(cisti(soba))
    return kod

@app.post("/sobe/zapocni/")
async def zapocni(kod : str, postavke : SobaPostavke):
    soba = nadji_sobu(kod)
    soba.postavke = postavke
    asyncio.create_task(zapocni_sobu(soba))
    return 200

@app.post("/sobe/napusti/")
async def napusti(igrac : Igrac):
    for soba in sobe:
        if igrac in soba.igraci:
            print(igrac)
            soba.igraci.remove(igrac)
            await update_sobu(soba)
            return 200
    raise HTTPException(status_code=404, detail="Soba ne postoji")
    
@app.get("/kategorije/")
async def kategorije():
    response = []
    
    with open("kategorije/kategorije.json", encoding="utf8") as f:
        kategorije = json.load(f)["kategorije"]
    
    for kategorija in kategorije:
        k = {
            "naziv": kategorija["naziv"],
            "potkategorije": []
        }
        
        for potkategorija in kategorija["potkategorije"]:
            print("UCITAVANJE", potkategorija["path"])
            with open("kategorije/" + potkategorija["path"], encoding="utf8") as f:
                pitanja = json.load(f)["pitanja"]
            
            k["potkategorije"].append({
                "naziv": potkategorija["naziv"],
                "broj": len(pitanja)
            })
            
        response.append(k)

    return {"kategorije": response}

@sio.on('*')
async def odabir(event : str, sid : str, data : str):
    if(not event.startswith("odabir_")):
        return
    
    kod = event.replace("odabir_", "")
    soba = nadji_sobu(kod)
    
    igrac = soba.nadji_igraca(data["igrac"]["ime"], data["igrac"]["avatar"])
    print(data["odgovor"])
    if(data["odgovor"] is not None):
        if(["a", "b", "c", "d"][data["odgovor"]] == soba.pitanje.tacan):
            igrac.poeni += 1


async def update_sobu(soba : Soba):
    s = soba.model_dump()
    if(soba.postavke is not None):
        s["postavke"].pop("custom_pitanja")
        s["postavke"].pop("kategorije")
        
    await sio.emit("soba_" + soba.kod, json.dumps(s))
    
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
     
    pitanja = ucitaj_pitanja(soba.postavke)
    
    for i in range(len(pitanja)):
        soba.trenutno_pitanje = i + 1
        soba.pitanje = pitanja[i]
        
        soba.stanje = "pitanje"
        await odbroji(soba, soba.postavke.vrijeme_pitanja)
        
        soba.stanje = "otkrij"
        await update_sobu(soba)
        await asyncio.sleep(1)
        await odbroji(soba, soba.postavke.vrijeme_otkrivanja)
    
    soba.stanje = "zavrseno"
    await update_sobu(soba)
    sobe.remove(soba)


def ucitaj_pitanja(postavke : SobaPostavke) -> List[Pitanje]:
    pitanja = postavke.custom_pitanja
    
    f = open("kategorije/kategorije.json", encoding="utf8")
    kategorije = json.load(f)["kategorije"]
    
    for kategorija in kategorije:
        for potkategorija in kategorija["potkategorije"]:
            print(potkategorija["naziv"], postavke.kategorije)
            if potkategorija["naziv"] in postavke.kategorije:
                f = open("kategorije/" + potkategorija["path"], encoding="utf8")
                for p in json.load(f)["pitanja"]:
                    pitanja.append(Pitanje(**p))
                f.close()

    random.shuffle(pitanja)
    return pitanja[:postavke.broj_pitanja]

def nadji_sobu(kod : str) -> Soba:
    return [soba for soba in sobe if soba.kod == kod][0]
        
async def cisti(soba : Soba): # ova funkcija brise sobu ako nije zapoceta 10 minuta od stvaranja
    await asyncio.sleep(600)
    if(soba.stanje == "cekanje"):
        sobe.remove(soba)

app.mount("/", socketio.ASGIApp(sio, static_files=static_files))
