from typing import List, Optional
from pydantic import BaseModel

class Igrac(BaseModel):
    ime: str
    avatar: int
    odabir: Optional[int] = None
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
    
    def nadji_igraca(self, ime, avatar) -> Igrac:
        return [korisnik for korisnik in self.igraci if (korisnik.ime, korisnik.avatar) == (ime, avatar)][0]
