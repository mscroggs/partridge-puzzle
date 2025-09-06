/* * * * * * * * * * * * * */
/*                         */
/* Solvability checker for */
/* Partridge puzzle widget */
/*                         */
/* Created by              */
/*         Matthew Scroggs */
/*                         */
/* mscroggs.co.uk/squares  */
/*                         */
/* * * * * * * * * * * * * */

var searching = false;
var cancel = false;
var found = false;
var counter = 0;
var exited = false;
var continue_from = [];
var n = null;
var pmap_in = null;
var rem_in = null;
var ready = true;

function complete(ls) {
    for (var i in ls) {
        for (var j in ls[i]) {
            if (!ls[i][j]) {
                return false;
            }
        }
    }
    return true;
}

function should_exit() {
    return counter > 500;
}

function is_solvable_from(pmap, rem, pre) {
    if (found || cancel) {
        return;
    }
    if (complete(pmap)) {
        if (cancel) {
            return;
        }
        postMessage(true);
        searching = false;
        found = true;
        return;
    }
    if (should_exit()) {
        if (!exited) {
            if (cancel) {
                return;
            }
            continue_from = pre;
            exited = true;
        }
        return;
    }

    var astart = n;
    if (pre.length < continue_from.length) {
        astart = continue_from[pre.length];
        var change = true;
        for (var i = 0; i < pre.length; i++) {
            if (pre[i] != continue_from[i]) {
                astart = n;
                break;
            }
        }
    }
    var count = 0;
    for (var i in pmap) {
        for (var j in pmap[i]) {
            if (!pmap[i][j]) {
                count += 1;
            }
        }
    }
    for (var i in pmap) {
        var line = "";
        for (var j in pmap[i]) {
            if (pmap[i][j]) {
                line += 1;
            } else {
                line += 0;
            }
        }
    }
    var tri_n = Math.floor(n * (n + 1) / 2);
    for (var i = 0; i < tri_n; i++) {
        for (var j = 0; j < tri_n; j++) {
            if (!pmap[i][j]) {
                for (var ri = astart; ri > 0; ri--) {
                    var a = rem[ri][0];
                    var rem_a = rem[ri][1];
                    if (rem_a > 0 && i + a <= tri_n && j + a <= tri_n) {
                        if (a == 1 && (i == 0 || i == 1 || j == 0 || j == 1 || i == tri_n - 1 || i == tri_n - 2 || j == tri_n - 1 || j == tri_n - 2)) {
                            continue;
                        }
                        var ok = true;
                        var pmap2 = [];
                        for (var p in pmap) {
                            pmap2[p] = [];
                            for (var q in pmap[p]) {
                                pmap2[p][q] = pmap[p][q];
                            }
                        }
                        for (var ai=i; ai < i + a; ai++) {
                            for (var aj=j; aj < j + a; aj++) {
                                if (pmap[ai][aj]) {
                                    ok = false;
                                    break;
                                }
                                pmap2[ai][aj] = true;
                            }
                            if(!ok) { break; }
                        }
                        if (ok) {
                            var rem2 = {};
                            for (var b in rem) {
                                if (b == ri) {
                                    rem2[b] = [rem[b][0], rem[b][1] - 1];
                                } else {
                                    rem2[b] = rem[b];
                                }
                            }
                            var np = [];
                            for (var pp in pre) {
                                np[pp] = pre[pp];
                            }
                            np[np.length] = a;
                            is_solvable_from(pmap2, rem2, np);
                            if (found) {
                                return;
                            }
                        }
                    }
                }
                if (pre.length == 0 && !found && !should_exit()) {
                    if (cancel) {
                        return;
                    }
                    postMessage(false);
                    searching = false;
                }
                counter++;
                return;
            }
        }
    }
}

addEventListener("message", (event) => {
    if (event.data[0] === "kill") {
        cancel = true;
        searching = false;
        return;
    }
    n = parseInt(event.data[0]);
    rem_in = {};
    for (var a in event.data[2]) {
        rem_in[a] = [parseInt(a), parseInt(event.data[2][a])];
    }
    pmap_in = [];
    for (var i in event.data[1]) {
        pmap_in[parseInt(i)] = [];
        for (var j in event.data[1][i]) {
            pmap_in[parseInt(i)][parseInt(j)] = (event.data[1][i][j] !== false);
        }
    }
    cancel = true;
    searching = true;
    found = false;
    continue_from = [];
})

function tick() {
    if (searching && ready) {
        counter = 0;
        cancel = false;
        exited = false;
        ready = false;
        is_solvable_from(pmap_in, rem_in, []);
        ready = true;
    }
}

setInterval(tick, 80);
