/* * * * * * * * * * * * * */
/*                         */
/* Partridge puzzle widget */
/*                         */
/* Created by              */
/*         Matthew Scroggs */
/*                         */
/* mscroggs.co.uk/squares  */
/*                         */
/* * * * * * * * * * * * * */

var psquares_n_start = 9;
var psquares_n = false;
var psquares_showhints = false;
var psquares_piece = false;
var psquares_placed = [];
var psquares_piece_map = {};
var psquares_remaining = {};
var psquares_ac = null;

function psquares_init(id, config) {
    var e = document.getElementById(id);
    for (var i in config) {
        if (i == "show_hints") {
            psquares_showhints = config[i];
        } else if (i == "n") {
            psquares_n_start = config[i];
        } else {
            e.innerHTML = "<span style='color:red'>Invalid config item: " + i + "</span>";
            return;
        }
    }

    var data = false;
    var n = false;
    if (window.location.search.length > 0) {
        var parts = window.location.search.substr(1).split("&");
        for (var i = 0; i < parts.length; i++) {
            var key = decodeURIComponent(parts[i].split("=")[0]);
            var value = decodeURIComponent(parts[i].split("=")[1]);
            if (key == "sq_n") {
                n = value / 1;
            } else if (key == "sq_d") {
                data = [];
                var vsp = value.split(";");
                for (var j = 0; j < vsp.length; j++) {
                    data[data.length] = [vsp[j].split(",")[0] / 1, vsp[j].split(",")[1] / 1, vsp[j].split(",")[2] / 1];
                }
            }
        }
    }

    if (data !== false && n !== false) {
        psquares_n_start = n
    }
    psquares_new(id);

    if (data !== false && n !== false) {
        for (var i = 0; i < data.length; ++i) {
            psquares_set_piece(data[i][0]);
            psquares_place_piece(data[i][1]+(data[i][0]-1)/2, data[i][2]+(data[i][0]-1)/2);
        }
    }
    psquares_update_hint();
    document.addEventListener(
        "keydown",
        (event) => {
          var keyName = event.key;

          if (keyName === "Escape") {
            psquares_unset_piece();
            return;
          }
        },
        false,
      );

}

function psquares_share() {
    var url = window.location.protocol + "//" + window.location.host + window.location.pathname;
    url += "?";
    url += "sq_n=" + psquares_n
    url += "&"
    url += "sq_d="
    var next = ""
    for (var i = 0; i < psquares_placed.length; i++) {
        if (psquares_placed[i] !== false) {
            url += next
            next = ";"
            url += psquares_placed[i][0] + ","
            url += psquares_placed[i][1][0][0] + ","
            url += psquares_placed[i][1][0][1]
        }
    }

    document.getElementById("psquares-sharearea").innerHTML = url
}

function psquares_new(id) {
    var e = document.getElementById(id);

    var html = "<div style='display:inline-block;vertical-align:top'>";
    html += "<div id='psquares-squares'></div>";
    html += "<div id='psquares-options'>";
    html += "<div>"
    html += "Size: <input type='number' min='1' max='15' onchange='psquares_update_squares(this.value)' value='";
    html += psquares_n_start;
    html += "' size='3' />"
    html += " &nbsp; "
    html += "<label><input type='checkbox' onchange='psquares_toggle_hints(this.checked)' id='psquares-hints-check'"
    if (psquares_showhints) {
        html += " checked"
    }
    html += "> Show hints</label>"
    html += "</div>";
    html += "<div id='psquares-hints'></div>";
    html += "<br />"
    html += "<div><button onclick='psquares_new(\"" + id + "\", psquares_n)'>Reset</button></div>";
// TODO
//    html += "<div><button onclick='psquares_share()'>Share current arrangement</button></div>";
//    html += "<div id='psquares-sharearea'></div>"
    html += "</div>";
    html += "</div>";
    html += "<div style='display:inline-block;vertical-align:top;max-width:40%;padding:10px'>";
    html += "<div id='psquares-pieces'></div>";
    html += "</div>";
    html += "</div>";

    e.innerHTML = html;

    psquares_update_squares(psquares_n_start);
}

function psquares_update_squares(n) {
    n = n/1;
    psquares_n = n;
    var tri_n = Math.floor(n * (n + 1) / 2);
    var e = document.getElementById("psquares-squares");
    var html = "<div id='psquares-grid-container' style='grid-template-columns:repeat("
        + tri_n
        + ", 1fr);grid-template-rows:repeat("
        + tri_n
        + ", 1fr);'>";
    for (var i = 0; i < tri_n; i++) {
        for (var j = 0; j < tri_n; j++) {
            html += "<div class='psquares-sq' id='psquares-piece-" + i + "-" + j + "'"
                + " onmouseover='psquares_set_piece_pos("+i+", "+j+")'"
                + " onclick='psquares_place_piece_then_update_hint("+i+", "+j+")'"
                + " style='grid-row:" + (j + 1) +  " / span 1;grid-column:" + (i + 1) + " / span 1'"
                + "></div>";
            html += "<div class='psquares-sq-highlight' id='psquares-piece-highlight-" + i + "-" + j + "'"
                + " style='grid-row:" + (j + 1) +  " / span 1;grid-column:" + (i + 1) + " / span 1'"
                + "></div>";
        }
    }
    html += "</div>";
    e.innerHTML = html;

    psquares_piece = false;
    psquares_placed = [];
    psquares_piece_map = {};

    psquares_remaining = {};
    for (var i = 1; i <= n; i++) {
        psquares_remaining[i] = i;
    }
    psquares_update_pieces();
    psquares_update_hint();
}

function psquares_update_pieces() {
    var e = document.getElementById("psquares-pieces");
    html = "<div style='max-width:400px;height:50px;margin:auto'>";
    if (psquares_piece === false) {
        html += "Click on a square below to pick it up.</div>"
    } else {
        html += "You are holding a " + psquares_piece + "&times;" + psquares_piece + " square. "
        html += "Click on the grid to place it. "
        html += "<a href='javascript:psquares_unset_piece()'>Put piece down</a>."
    }
    html += "</div>"
    var tri_n = Math.floor(psquares_n * (psquares_n + 1) / 2);
    for (var i in psquares_remaining) {
        var rem = psquares_remaining[i];
        if (psquares_piece == i) {
            rem -= 1;
        }
        if (rem > 0) {
            size = 600 / tri_n * i;
            html += "<div style='padding:10px;margin-bottom:" + (6 * (rem - 1)) + "px;margin-right:" + (size - 20) + "px;display:inline-block'>";
            for (var j = 0; j < rem; j++) {
                html += "<a class='noul' href='javascript:psquares_set_piece(" + i + ")' style='display:inline-block;margin-right:" + (20 - size) + "px'>";
                html += "<div style='display:grid;height:" + size + "px;width:" + size + "px;"
                    + "position:relative;top:" + (j * 6) + "px'>";
                html += "<div class='psquares-sq placed piece" + i + "' style='grid-column: 1 / span " + i + ";grid-row: 1 / span " + i + "'>";
                html += "<div>" + i + "&times;" + i + "</div>";
                html += "</div></div>";
                html += "</a>";
            }
            html += "</div> ";
        }
    }
    e.innerHTML = html;

}

function psquares_compute_top_left(cx, cy, n) {
    var tri_n = Math.floor(psquares_n * (psquares_n + 1) / 2);
    return [
        Math.min(tri_n - n, Math.max(0, Math.ceil(cx - (n - 1) / 2))),
        Math.min(tri_n - n, Math.max(0, Math.ceil(cy - (n - 1) / 2))),
    ];
}

function psquares_set_piece(n) {
    n = n/1;
    psquares_piece = n;
    var tri_n = Math.floor(psquares_n * (psquares_n + 1) / 2);
    for (var i = 0; i < tri_n; i++) {
        for (var j = 0; j < tri_n; j++) {
            document.getElementById("psquares-piece-highlight-" + i + "-" + j).className = "psquares-sq-highlight";
        }
    }
    psquares_update_pieces()
}

function psquares_unset_piece() {
    psquares_piece = false;
    var tri_n = Math.floor(psquares_n * (psquares_n + 1) / 2);
    for (var i = 0; i < tri_n; i++) {
        for (var j = 0; j < tri_n; j++) {
            document.getElementById("psquares-piece-highlight-" + i + "-" + j).className = "psquares-sq-highlight";
        }
    }
    psquares_update_pieces()
}

function psquares_set_piece_pos(x,y) {
    if (psquares_piece === false) {
        return;
    }
    x = x/1;
    y = y/1;
    var tri_n = Math.floor(psquares_n * (psquares_n + 1) / 2);
    for (var i = 0; i < tri_n; i++) {
        for (var j = 0; j < tri_n; j++) {
            document.getElementById("psquares-piece-highlight-" + i + "-" + j).className = "psquares-sq-highlight";
        }
    }
    var tl = psquares_compute_top_left(x, y, psquares_piece);
    for (var i = tl[0]; i < tl[0] + psquares_piece; i++) {
        for (var j = tl[1]; j < tl[1] + psquares_piece; j++) {
            if ([i, j] in psquares_piece_map && psquares_piece_map[[i, j]] !== false) {
                document.getElementById("psquares-piece-highlight-" + i + "-" + j).className = "psquares-sq-highlight overlap";
            } else {
                document.getElementById("psquares-piece-highlight-" + i + "-" + j).className = "psquares-sq-highlight active";
            }
        }
    }
}

function psquares_place_piece_then_update_hint(x,y) {
    psquares_place_piece(x,y)
    psquares_update_hint()
}

function psquares_place_piece(x,y) {
    if (psquares_piece === false) {
        if ([x, y] in psquares_piece_map && psquares_piece_map[[x, y]] !== false) {
            var piece_n = psquares_piece_map[[x, y]];
            var psize = psquares_placed[piece_n][0];
            var positions = psquares_placed[piece_n][1];
            psquares_remaining[psize]++;
            psquares_piece = psize;
            psquares_update_pieces();
            document.getElementById("psquares-sq-placed-" + piece_n).remove();
            for (var i = 0; i < positions.length; i++) {
                psquares_piece_map[positions[i]] = false;
            }
            psquares_placed[piece_n] = false;
            psquares_set_piece_pos(x,y);
        }
        return;
    }
    x = x/1;
    y = y/1;
    var tri_n = Math.floor(psquares_n * (psquares_n + 1) / 2);

    var tl = psquares_compute_top_left(x, y, psquares_piece);
    for (var i = tl[0]; i < tl[0] + psquares_piece; i++) {
        for (var j = tl[1]; j < tl[1] + psquares_piece; j++) {
            if ([i, j] in psquares_piece_map && psquares_piece_map[[i, j]] !== false) {
                return;
            }
        }
    }
    var piece_n = 0;
    while (piece_n < psquares_placed.length && psquares_placed[piece_n] !== false) {
        piece_n++;
    }
    psquares_placed[piece_n] = [psquares_piece, []];
    for (var i = tl[0]; i < tl[0] + psquares_piece; i++) {
        for (var j = tl[1]; j < tl[1] + psquares_piece; j++) {
            psquares_placed[piece_n][1][psquares_placed[piece_n][1].length] = [i, j];
            psquares_piece_map[[i, j]] = piece_n;
        }
    }

    var div = document.createElement("div");
    div.id = "psquares-sq-placed-" + piece_n;
    div.className = "psquares-sq placed piece" + psquares_piece;
    div.style.gridColumn = (tl[0] + 1) + " / span " + psquares_piece;
    div.style.gridRow = (tl[1] + 1) + " / span " + psquares_piece;
    div.innerHTML = "<div>" + psquares_piece + "&times;" + psquares_piece + "</div>";

    document.getElementById("psquares-grid-container").appendChild(div)

    psquares_remaining[psquares_piece]--;
    psquares_piece = false;
    psquares_update_pieces();

    for (var i = 0; i < tri_n; i++) {
        for (var j = 0; j < tri_n; j++) {
            document.getElementById("psquares-piece-highlight-" + i + "-" + j).className = "psquares-sq-highlight";
        }
    }
}

function psquares_update_hint() {
    var e = document.getElementById("psquares-hints");
    if(!psquares_showhints) {
        e.innerHTML = "";
        e.style.color = "#000000"
        return
    }
    if (psquares_n == 1) {
        e.innerHTML = "This puzzle can be solved.";
        e.style.color = "#008000"
    } else if (psquares_n < 8) {
        e.innerHTML = "This puzzle cannot be solved.";
        e.style.color = "#FF0000"
    } else {
        if (Object.keys(psquares_piece_map).length == 0) {
            e.innerHTML = "This puzzle can be solved.";
            e.style.color = "#008000"
            return
        }
        psquares_search_for_solution()
    }
}


async function psquares_search_for_solution() {
    var e = document.getElementById("psquares-hints");
    if (psquares_ac) {
        psquares_ac.abort()
        psquares_ac = null
    }

    psquares_ac = new AbortController()
    e.innerHTML = "Checking if puzzle is solvable (this may take a while).";
    e.style.color = "#000000"

    console.log("a")
    try {
        var solvable = await psquares_is_solvable(psquares_ac.signal)
        if (solvable) {
            e.innerHTML = "This puzzle can be solved with the current pieces placed.";
            e.style.color = "#008000"
        } else {
            e.innerHTML = "This puzzle cannot be solved with the current pieces placed.<br />Try moving or removing a piece.";
            e.style.color = "#FF0000"
        }
    } catch {
    }
    console.log("b")
}

function psquares_is_solvable(asignal) {
    return new Promise( (resolve, reject) => {
        var t = setTimeout( () => {
            resolve(psquares_is_solvable_from(psquares_piece_map, psquares_remaining));
        });

        asignal.addEventListener("abort", () => {
            var error = new DOMException("Cancel", "AbortError")
            clearTimeout(t)
            reject( error )
        });
    });
}

function psquares_is_solvable_from(pmap, rem) {
    var tri_n = Math.floor(psquares_n * (psquares_n + 1) / 2);
    if (Object.keys(pmap).length == tri_n * tri_n) {
        return true
    }
    for (var t = 0; t < tri_n * 2 - 1; t++) {
        for (var i = Math.max(0, t - tri_n); i < tri_n && i <= t; i++) {
            var j = t - i
            //if (logging) { console.log(i, j) }
            if (!([i, j] in pmap) || pmap[[i, j]] === false) {
                for (a in rem) {
                    if (rem[a] > 0) {
                        if (a == 1 && (i == 0 || i == 1 || j == 0 || j == 1 || i == tri_n - 1 || i == tri_n - 2 || j == tri_n - 1 || j == tri_n - 2)) {
                            continue;
                        }
                        var ok = true;
                        var pmap2 = {}
                        for (var p in pmap) {
                            pmap2[p] = pmap[p];
                        }
                        for (var ai=0; ai < a; ai++) {
                            for (var aj=0; aj < a; aj++) {
                                //if (logging) { console.log("=>", i+ai, j+aj) }
                                if ([i+ai, j+aj] in pmap && pmap[[i+ai, j+aj]] !==false) {
                                    ok = false
                                    break
                                }
                                pmap2[[i+ai, j+aj]] = "!"
                            }
                            if(!ok) { break }
                        }
                        if (ok) {
                            var rem2 = {}
                            for (b in rem) {
                                if (b == a) {
                                    rem2[b] = rem[a] - 1
                                } else {
                                    rem2[b] = rem[b]
                                }
                            }
                            if(psquares_is_solvable_from(pmap2, rem2)) {
                                return true
                            }
                        }
                    }
                }
                return false
            }
        }
    }
}

function psquares_toggle_hints(value) {
    psquares_showhints = value
    psquares_update_hint()
}
