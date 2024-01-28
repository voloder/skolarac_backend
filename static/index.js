const socket = io();

var soba;

$.post(
    "/sobe/kreiraj/", function (kod) {
        $("#kod").html(`<h1>${kod}</h1>`);

        socket.on("soba_" + kod, function (data) {
            soba = JSON.parse(data)
            socketEvent(soba)
        });
    },
);

function socketEvent(soba) {
    console.log(soba);
    if (soba.igraci.length != 0) {
        $("#nemaigraca").addClass("nodisplay");
    } else {
        $("#nemaigraca").removeClass("nodisplay");
    }

    if (soba.stanje == "cekanje") {
        $("#postavke").removeClass("nodisplay");
        $("#main").removeClass("nodisplay");
        $("#igraci").empty();
        soba.igraci.forEach(e => $("#igraci").append(`<p class="m-0"><img class="p-1" src="static/avatari/${e.avatar}.png" style="height:2rem">${e.ime}</p>`))
    }

    if (soba.stanje == "countdown") {
        $("#ulaz").addClass("nodisplay");
        $("#postavke").addClass("nodisplay");
        $("#main").addClass("nodisplay");
        $("#countdown-div").removeClass("nodisplay");
        $("#countdown").html(soba.countdown);
    }

    if (soba.stanje == "pitanje") {
        $("#ulaz").addClass("nodisplay");
        $("#countdown-div").addClass("nodisplay");
        $("#pitanje-div").removeClass("nodisplay");
        $("#pitanje").html(soba.pitanje.pitanje);
        $("#leaderboard-div").removeClass("nodisplay");
        $("#leaderboard").html(soba.igraci.map(e => `
                <p class="m-0" style="text-overflow:'...${e.poeni}';overflow:hidden;white-space:nowrap;">
                    <img class="p-1" src="static/avatari/${e.avatar}.png" style="height:2rem">
                    ${e.ime}  -  ${e.poeni}
                </p>`).join(""));
        $("#odgovori-div").removeClass("nodisplay");
        $("#a").html(`${soba.pitanje.a}`);
        $("#b").html(`${soba.pitanje.b}`);
        $("#c").html(`${soba.pitanje.c}`);
        $("#d").html(`${soba.pitanje.d}`);
        $(`#a`).removeClass("text-success");
        $(`#b`).removeClass("text-success");
        $(`#c`).removeClass("text-success");
        $(`#d`).removeClass("text-success");
        $("#vrijeme").removeClass("nodisplay");
        $("#broj-pitanja").removeClass("nodisplay");
        $("#vrijeme").html(soba.countdown);
        $("#broj-pitanja").html(`PITANJE ${soba.trenutno_pitanje}/${soba.postavke.broj_pitanja}`);
    }

    if (soba.stanje == "otkrij") {
        $(`#${soba.pitanje.tacan}`).addClass("text-success");
        $("#vrijeme").html(soba.countdown);
        $("#leaderboard").html(soba.igraci.map(e => `
                <p class="m-0" style="text-overflow:'...${e.poeni}';overflow:hidden;white-space:nowrap;">
                    <img class="p-1" src="static/avatari/${e.avatar}.png" style="height:2rem">
                    ${e.ime}  -  ${e.poeni}
                </p>`).join(""));
    }

    if (soba.stanje == "zavrseno") {
        $("#vrijeme").addClass("nodisplay");
        $("#pitanje-div").addClass("nodisplay");
        $("#leaderboard-div").addClass("nodisplay");
        $("#zavrseno-div").removeClass("nodisplay");
        soba.igraci.sort((a, b) => b.poeni - a.poeni);

        soba.igraci.forEach(e => $("#zavrsni-leaderboard").append(`<p class="m-0"><img class="m-1" src="static/avatari/${e.avatar}.png" style="height:3rem">${e.ime} - ${e.poeni}</p>`))

    }

}


function zapocniSobu() {
    console.log(customPitanja)
    var kategorije = odabraneKategorije();

    $.ajax({
        type: "POST",
        url: "/sobe/zapocni/?kod=" + soba.kod,
        data: JSON.stringify({
            broj_pitanja: $("#broj-pitanja").val(),
            vrijeme_pitanja: $("#vrijeme-pitanja").val(),
            vrijeme_otkrivanja: $("#vrijeme-otkrivanja").val(),
            kategorije: kategorije,
            custom_pitanja: customPitanja
        },
        ),
        contentType: "application/json",
    });
}

var customPitanja;


$(window).on('load', function () {
    $("#kategorije").on("click", function () {
        updateKategorije();
        sacuvajKategorije();
    });
    $("#vrijeme-pitanja-label").html("Vrijeme pitanja: " + $("#vrijeme-pitanja").val() + "s");
    $("#vrijeme-otkrivanja-label").html("Vrijeme otkrivanja: " + $("#vrijeme-otkrivanja").val() + "s");
    $("#broj-pitanja-label").html("Broj pitanja: " + $("#broj-pitanja").val());

    $("#vrijeme-pitanja").on("input change load", function () {
        $("#vrijeme-pitanja-label").html("Vrijeme pitanja: " + $("#vrijeme-pitanja").val() + "s");
    });

    $("#vrijeme-otkrivanja").on("input change load", function () {
        $("#vrijeme-otkrivanja-label").html("Vrijeme otkrivanja: " + $("#vrijeme-otkrivanja").val() + "s");
    });

    $("#broj-pitanja").on("input change load", function () {
        $("#broj-pitanja-label").html("Broj pitanja: " + $("#broj-pitanja").val());
    });

    $("#zapocni-button").on("click", function () {
        zapocniSobu();
    });

    $(".openbtn").on("click", function () {
        openNav();
    });

    $(".closebtn").on("click", function () {
        closeNav();
    });

    $("#add-custom").on("click", function () {
        var index = customPitanja.length;
        customPitanja.push(
            {
                pitanje: "",
                a: "",
                b: "",
                c: "",
                d: "",
                tacan: "a"
            }
        );

        dodajPitanje(index);
    });


    var pitanja = localStorage.getItem("customPitanja");
    if (pitanja == null) {
        customPitanja = [];
    } else {
        try {
            customPitanja = JSON.parse(pitanja);
            customPitanja.forEach((e, i) => {
                dodajPitanje(i);
                $(`#pitanje-${i}`).val(e.pitanje);
                $(`#a-${i}`).val(e.a);
                $(`#b-${i}`).val(e.b);
                $(`#c-${i}`).val(e.c);
                $(`#d-${i}`).val(e.d);
                $(`input[name=${i}]`).each(function () {
                    if ($(this).parent().parent().children().first().html().toLowerCase() == e.tacan) {
                        $(this).prop("checked", true);
                    }
                });
            });
        } catch {
            customPitanja = [];
            localStorage.setItem("customPitanja", JSON.stringify(customPitanja));
        }
    }

}
);

$.get("/kategorije/", function (data) {
    data.kategorije.forEach(e => {
        $("#kategorije").append(`<h2>${e.naziv}</h2>`);

        e.potkategorije.forEach(p => $("#kategorije").append(`
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="checkbox" id="${p.naziv.replace(/\W/g, '_')}" value="${p.naziv}">
                        <label class="form-check-label" for="${p.naziv}">${p.naziv}</label>
                    </div>
                    `))
    });

    var sacuvaneKategorije = localStorage.getItem("kategorije");
    if (sacuvaneKategorije != null) {
        sacuvaneKategorije = JSON.parse(sacuvaneKategorije);
        sacuvaneKategorije.forEach(e => {
            console.log(e)
            $(`#${e.replace(/\W/g, '_')}`).prop("checked", true);
        });
    }
    updateKategorije();
});

function updateKategorije() {
    var kategorije = odabraneKategorije();

    if (kategorije.length == 0) {
        $("#nema-kategorije-tekst").removeClass("nodisplay");
        $("#nema-kategorije-strijela").removeClass("nodisplay");
    } else {
        $("#nema-kategorije-tekst").addClass("nodisplay");
        $("#nema-kategorije-strijela").addClass("nodisplay");
    }

}

function openNav() {
    document.getElementById("postavke").style.transform = "translate(0, 0)";
}

function closeNav() {
    document.getElementById("postavke").style.transform = "translate(100%, 0)";
}

function dodajPitanje(index) {
    $("#custom-pitanja").append(
        `<div class="form-group">
                    <div class="input-group mb-1 mt-2 d-flex">

                        <input type="text" class="form-control" placeholder="Pitanje" id="pitanje${index}">
                        <span class="input-group-text" id="izbrisi-${index}"><i class="bi bi-trash text-danger"></i></span>
                    </div>

                    <div class="input-group mb-1 d-flex">
                        <span class="input-group-text">A</span>
                        <input type="text" class="form-control" id="a-${index}">
                        <span class="input-group-text"><input class="form-check-input" type="radio" name="${index}"></span>
                    </div>
                    <div class="input-group mb-1 d-flex">
                        <span class="input-group-text">B</span>
                        <input type="text" class="form-control" id="b-${index}">
                        <span class="input-group-text"><input class="form-check-input" type="radio" name="${index}"></span>
                    </div>
                    <div class="input-group mb-1 d-flex">
                        <span class="input-group-text">C</span>
                        <input type="text" class="form-control" id="c-${index}">
                        <span class="input-group-text"><input class="form-check-input" type="radio" name="${index}"></span>
                    </div>
                    <div class="input-group mb-1 d-flex">
                        <span class="input-group-text">D</span>
                        <input type="text" class="form-control" id="d-${index}">
                        <span class="input-group-text"><input class="form-check-input" type="radio" name="${index}"></span>
                    </div>
                </div>`);

    $(`#izbrisi-${index}`).on("click",
        function () {
            customPitanja.splice(index, 1);
            $(this).parent().parent().remove();
            sacuvajPitanja();
        });

    $(`#pitanje-${index}`).on("input change", function () {
        customPitanja[index].pitanje = $(this).val();
        sacuvajPitanja();
    });

    $(`#a-${index}`).on("input change", function () {
        customPitanja[index].a = $(this).val();
        sacuvajPitanja();
    });

    $(`#b-${index}`).on("input change", function () {
        customPitanja[index].b = $(this).val();

        sacuvajPitanja();
    });

    $(`#c-${index}`).on("input change", function () {
        customPitanja[index].c = $(this).val();
        sacuvajPitanja();

    });

    $(`#d-${index}`).on("input change", function () {
        customPitanja[index].d = $(this).val();
        sacuvajPitanja();

    });

    $(`input[name=${index}]`).on("change", function () {
        customPitanja[index].tacan = $(this).parent().parent().children().first().html().toLowerCase();
        sacuvajPitanja();
    });
}

function odabraneKategorije() {
    var kategorije = [];
    $("#kategorije input:checked").each(function () {
        kategorije.push($(this).val());
    });
    return kategorije;
}

function sacuvajPitanja() {
    localStorage.setItem("customPitanja", JSON.stringify(customPitanja));
}

function sacuvajKategorije() {
    localStorage.setItem("kategorije", JSON.stringify(odabraneKategorije()));
}
