from typing import List, Optional
from pydantic import BaseModel

class Igrac(BaseModel):
    ime: str
    avatar: int
    poeni: int = 0
    
    
class Pitanje(BaseModel):
    pitanje: str 
    a: str
    b: str
    c: str
    d: str
    tacan: str

class Soba(BaseModel):
    kod: str
    igraci: List[Igrac]
    countdown: int = 0
    pitanje: Pitanje | None = None
    stanje: str = "cekanje"
    vrijeme_pitanja: int = 10
    vrijeme_otkrivanja: int = 3
    
    broj_pitanja: int = 10
    trenutno_pitanje: int = 0
    kategorije: List[str] = []
    
    
    def nadji_igraca(self, ime, avatar) -> Igrac:
        return [igrac for igrac in self.igraci if (igrac.ime, igrac.avatar) == (ime, avatar)][0]
