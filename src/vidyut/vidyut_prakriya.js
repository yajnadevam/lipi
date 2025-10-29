let wasm;

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_export_2.set(idx, obj);
    return idx;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

const cachedTextEncoder = (typeof TextEncoder !== 'undefined' ? new TextEncoder('utf-8') : { encode: () => { throw Error('TextEncoder not available') } } );

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}
/**
 * Defines an *antargaṇa*.
 *
 * The dhatus in the Dhatupatha are organized in ten large *gaṇa*s or classes. Within these larger
 * *gaṇa*s, certain *antargaṇa*s or subclasses have extra properties that affect the derivations
 * they produce. For example, dhatus in the *kuṭādi antargaṇa* generally do not allow *guṇa* vowel
 * changes.
 *
 * Since most dhatus appear exactly once per *gaṇa*, this crate can usually infer whether a dhatu
 * is in a specific *antargaṇa*. However, some *gaṇa*s have dhatus that repeat, and these
 * repeating dhatus cause ambiguities for our code. (For example, `juqa~` appears twice in
 * *tudādigaṇa*: once in *kuṭādi* and once outside of it.)
 *
 * To avoid this ambiguity, we require that certain *antargaṇa*s are declared up-front.
 *
 * (Can we disambiguate by checking the dhatu's index within its gana? Unfortunately, no. There is
 * no canonical version of the Dhatupatha, and we cannot expect that a dhatu's index is consistent
 * across all of these versions. So we thought it better to avoid hard-coding indices or requiring
 * callers to follow our specific conventions.)
 * @enum {0 | 1 | 2 | 3 | 4}
 */
export const Antargana = Object.freeze({
    /**
     * *Antargaṇa* of *bhū* gana. A dhatu in this *antargaṇa* uses a shortened vowel when
     * followed by *ṇic-pratyaya*.
     */
    Ghatadi: 0, "0": "Ghatadi",
    /**
     * *Antargaṇa* of *tud* gana. Pratyayas that follow dhatus in *kuṭādi-gaṇa* will generally be
     * marked `Nit` per 1.2.1. Required because of duplicates like `juqa~`.
     */
    Kutadi: 1, "1": "Kutadi",
    /**
     * *Antargaṇa* of *cur* gana ending with `zvada~` / `svAda~`. A dhatu in this *antargaṇa*
     * optionaly uses *ṇic-pratyaya* when taking an object. Required because of duplicates like
     * `tuji~`.
     */
    Asvadiya: 2, "2": "Asvadiya",
    /**
     * *Antargaṇa* of *cur* gana ending with `Dfza~`. A dhatu in this *antargaṇa* optionally uses
     * *ṇic-pratyaya*. Required because of duplicates like `SraTa~`.
     */
    Adhrshiya: 3, "3": "Adhrshiya",
    /**
     * *Antargaṇa* of *cur* gana ending with `kusma~`. A dhatu in this *antargaṇa* is always
     * *ātmanepadī*. Required because of duplicates like `daSi~`.
     */
    Akusmiya: 4, "4": "Akusmiya",
});
/**
 * The complete list of ordinary *kṛt pratyaya*s.
 *
 * Rust's naming convention is to start enum values with capital letters. However, we allow mixed
 * case explicitly here so that we can name pratyayas more concisely with SLP1. Doing so helps us
 * distinguish between pratyayas like `naN` and `nan`.
 * @enum {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 | 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59 | 60 | 61 | 62 | 63 | 64 | 65 | 66 | 67 | 68 | 69 | 70 | 71 | 72 | 73 | 74 | 75 | 76 | 77 | 78 | 79 | 80 | 81 | 82 | 83 | 84 | 85 | 86 | 87 | 88 | 89 | 90 | 91 | 92 | 93 | 94 | 95 | 96 | 97 | 98 | 99 | 100 | 101 | 102 | 103 | 104 | 105 | 106 | 107 | 108 | 109 | 110 | 111 | 112 | 113 | 114 | 115 | 116 | 117 | 118 | 119 | 120 | 121}
 */
export const BaseKrt = Object.freeze({
    /**
     * -a
     */
    a: 0, "0": "a",
    /**
     * -a,
     */
    aN: 1, "1": "aN",
    /**
     * -a
     */
    ac: 2, "2": "ac",
    /**
     * -a
     */
    aR: 3, "3": "aR",
    /**
     * -aDyE
     */
    aDyE: 4, "4": "aDyE",
    /**
     * -aDyE
     */
    aDyEn: 5, "5": "aDyEn",
    /**
     * -at (jarat)
     */
    atfn: 6, "6": "atfn",
    /**
     * -aTu (vepaTu). Allowed only for dhatus that are `qvit`.
     */
    aTuc: 7, "7": "aTuc",
    /**
     * -ani
     */
    ani: 8, "8": "ani",
    /**
     * -anIya (gamanIya, BavanIya, ...)
     */
    anIyar: 9, "9": "anIyar",
    /**
     * -a
     */
    ap: 10, "10": "ap",
    /**
     * -ase
     */
    ase: 11, "11": "ase",
    /**
     * -ase
     */
    asen: 12, "12": "asen",
    /**
     * -Alu
     */
    Aluc: 13, "13": "Aluc",
    /**
     * -Aru
     */
    Aru: 14, "14": "Aru",
    /**
     * -ika
     */
    ika: 15, "15": "ika",
    /**
     * -ikavaka
     */
    ikavaka: 16, "16": "ikavaka",
    /**
     * -i
     */
    iY: 17, "17": "iY",
    /**
     * -itra
     */
    itra: 18, "18": "itra",
    /**
     * -in. The trailing `_` is to avoid colliding with Rust's `in` keyword.
     */
    in_: 19, "19": "in_",
    /**
     * -in
     */
    ini: 20, "20": "ini",
    /**
     * -izRu (alaMkarizRu, prajanizRu, ...)
     */
    izRuc: 21, "21": "izRuc",
    /**
     * -u (yuyutsu, Bikzu, ...)
     */
    u: 22, "22": "u",
    /**
     * -uka
     */
    ukaY: 23, "23": "ukaY",
    /**
     * -Uka
     */
    Uka: 24, "24": "Uka",
    /**
     * -a
     */
    ka: 25, "25": "ka",
    /**
     * -a
     */
    kaY: 26, "26": "kaY",
    /**
     * -aDyE
     */
    kaDyE: 27, "27": "kaDyE",
    /**
     * -aDyE
     */
    kaDyEn: 28, "28": "kaDyEn",
    /**
     * -am
     */
    kamul: 29, "29": "kamul",
    /**
     * -as (visfpaH, ...)
     */
    kasun: 30, "30": "kasun",
    /**
     * -a
     */
    kap: 31, "31": "kap",
    /**
     * -ase
     */
    kase: 32, "32": "kase",
    /**
     * -ase
     */
    kasen: 33, "33": "kasen",
    /**
     * -Ana (cakrARa, ...)
     */
    kAnac: 34, "34": "kAnac",
    /**
     * -i (udaDi, ...)
     */
    ki: 35, "35": "ki",
    /**
     * -i
     */
    kin: 36, "36": "kin",
    /**
     * -ura (BaNgura, ...)
     */
    kurac: 37, "37": "kurac",
    /**
     * -elima (pacelima, ...)
     */
    kelimar: 38, "38": "kelimar",
    /**
     * -ta (gata, bhUta, ...)
     */
    kta: 39, "39": "kta",
    /**
     * -tavat (gatavat, bhUtavat, ...)
     */
    ktavatu: 40, "40": "ktavatu",
    /**
     * -ti
     */
    ktic: 41, "41": "ktic",
    /**
     * -ti
     */
    ktin: 42, "42": "ktin",
    /**
     * -tri
     */
    ktri: 43, "43": "ktri",
    /**
     * -tvA (gatvA, bhUtva, ...)
     */
    ktvA: 44, "44": "ktvA",
    /**
     * -nu
     */
    knu: 45, "45": "knu",
    /**
     * -mara
     */
    kmarac: 46, "46": "kmarac",
    /**
     * -ya
     */
    kyap: 47, "47": "kyap",
    /**
     * -ru (BIru)
     */
    kru: 48, "48": "kru",
    /**
     * -ruka (BIruka)
     */
    krukan: 49, "49": "krukan",
    /**
     * -luka (BIluka)
     */
    klukan: 50, "50": "klukan",
    /**
     * -van
     */
    kvanip: 51, "51": "kvanip",
    /**
     * -vara
     */
    kvarap: 52, "52": "kvarap",
    /**
     * -vas
     */
    kvasu: 53, "53": "kvasu",
    /**
     * -snu (glAsnu, jizRu, ...)
     */
    ksnu: 54, "54": "ksnu",
    /**
     * (empty suffix)
     */
    kvin: 55, "55": "kvin",
    /**
     * (empty suffix)
     */
    kvip: 56, "56": "kvip",
    /**
     * -a (priyaMvada, vaSaMvada)
     */
    Kac: 57, "57": "Kac",
    /**
     * -a
     */
    KaS: 58, "58": "KaS",
    /**
     * -a (Izatkara, duzkara, sukara, ...)
     */
    Kal: 59, "59": "Kal",
    /**
     * -izRu
     */
    KizRuc: 60, "60": "KizRuc",
    /**
     * -uka
     */
    KukaY: 61, "61": "KukaY",
    /**
     * -ana
     */
    Kyun: 62, "62": "Kyun",
    /**
     * -a
     */
    Ga: 63, "63": "Ga",
    /**
     * -a
     */
    GaY: 64, "64": "GaY",
    /**
     * -in
     */
    GinuR: 65, "65": "GinuR",
    /**
     * -ura
     */
    Gurac: 66, "66": "Gurac",
    /**
     * -van
     */
    Nvanip: 67, "67": "Nvanip",
    /**
     * -Ana
     */
    cAnaS: 68, "68": "cAnaS",
    /**
     * -ana
     */
    Yyuw: 69, "69": "Yyuw",
    /**
     * -a
     */
    wa: 70, "70": "wa",
    /**
     * -a
     */
    wak: 71, "71": "wak",
    /**
     * -a
     */
    qa: 72, "72": "qa",
    /**
     * -ara,
     */
    qara: 73, "73": "qara",
    /**
     * -u
     */
    qu: 74, "74": "qu",
    /**
     * -a
     */
    Ra: 75, "75": "Ra",
    /**
     * -am
     */
    Ramul: 76, "76": "Ramul",
    /**
     * -in
     */
    Rini: 77, "77": "Rini",
    /**
     * -ya
     */
    Ryat: 78, "78": "Ryat",
    /**
     * -ana
     */
    Ryuw: 79, "79": "Ryuw",
    /**
     * (empty)
     */
    Rvi: 80, "80": "Rvi",
    /**
     * -aka
     */
    Rvuc: 81, "81": "Rvuc",
    /**
     * -aka
     */
    Rvul: 82, "82": "Rvul",
    /**
     * -tave
     */
    taveN: 83, "83": "taveN",
    /**
     * -tave
     */
    taven: 84, "84": "taven",
    /**
     * -tavE
     */
    tavE: 85, "85": "tavE",
    /**
     * -tavya (gantavya, bhavitavya, ...)
     */
    tavya: 86, "86": "tavya",
    /**
     * -tavya
     */
    tavyat: 87, "87": "tavyat",
    /**
     * -tum (gantum, bhavitum, ...)
     */
    tumun: 88, "88": "tumun",
    /**
     * -tf (gantA, bhavitA, ...)
     */
    tfc: 89, "89": "tfc",
    /**
     * -tf
     */
    tfn: 90, "90": "tfn",
    /**
     * -tos (udetoH)
     */
    tosun: 91, "91": "tosun",
    /**
     * -Taka (gATaka)
     */
    Takan: 92, "92": "Takan",
    /**
     * -na
     */
    naN: 93, "93": "naN",
    /**
     * -naj
     */
    najiN: 94, "94": "najiN",
    /**
     * -na (svapna)
     */
    nan: 95, "95": "nan",
    /**
     * -ni,
     */
    ni: 96, "96": "ni",
    /**
     * -man
     */
    manin: 97, "97": "manin",
    /**
     * -ya
     */
    ya: 98, "98": "ya",
    /**
     * -ya
     */
    yat: 99, "99": "yat",
    /**
     * -ana
     */
    yuc: 100, "100": "yuc",
    /**
     * -na (namra, kampra, ...)
     */
    ra: 101, "101": "ra",
    /**
     * -ru
     */
    ru: 102, "102": "ru",
    /**
     * -ana
     */
    lyu: 103, "103": "lyu",
    /**
     * -ana
     */
    lyuw: 104, "104": "lyuw",
    /**
     * -van
     */
    vanip: 105, "105": "vanip",
    /**
     * -vara
     */
    varac: 106, "106": "varac",
    /**
     * (empty suffix)
     */
    vic: 107, "107": "vic",
    /**
     * (none)
     */
    viw: 108, "108": "viw",
    /**
     * -aka
     */
    vuY: 109, "109": "vuY",
    /**
     * -aka
     */
    vun: 110, "110": "vun",
    /**
     * -Aka
     */
    zAkan: 111, "111": "zAkan",
    /**
     * -tra
     */
    zwran: 112, "112": "zwran",
    /**
     * -aka
     */
    zvun: 113, "113": "zvun",
    /**
     * -a
     */
    Sa: 114, "114": "Sa",
    /**
     * -at (gacCat, Bavat, ...)
     */
    Satf: 115, "115": "Satf",
    /**
     * -aDyE
     */
    SaDyE: 116, "116": "SaDyE",
    /**
     * -aDyE
     */
    SaDyEn: 117, "117": "SaDyEn",
    /**
     * -Ana (laBamAna, sevamAna, ...)
     */
    SAnac: 118, "118": "SAnac",
    /**
     * -Ana
     */
    SAnan: 119, "119": "SAnan",
    /**
     * -se
     */
    se: 120, "120": "se",
    /**
     * -se
     */
    sen: 121, "121": "sen",
});
/**
 * The pada of some *tiṅanta* or *kṛdanta*.
 * @enum {0 | 1}
 */
export const DhatuPada = Object.freeze({
    /**
     * *Parasmaipada*.
     */
    Parasmaipada: 0, "0": "Parasmaipada",
    /**
     * *Ātmanepada*.
     */
    Atmanepada: 1, "1": "Atmanepada",
});
/**
 * Defines a *gaṇa*.
 *
 * The dhatus in the Dhatupatha are organized in ten large *gaṇa*s or classes. These gaṇas
 * add various properties to the dhatu, most notably the specific *vikaraṇa* (stem suffix) we use
 * before *sārvadhātuka* suffixes.
 * @enum {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10}
 */
export const Gana = Object.freeze({
    /**
     * The first gaṇa, whose first dhatu is `BU`.
     */
    Bhvadi: 0, "0": "Bhvadi",
    /**
     * The second gaṇa, whose first dhatu is `ad`.
     */
    Adadi: 1, "1": "Adadi",
    /**
     * The third gaṇa, whose first dhatu is `hu`.
     */
    Juhotyadi: 2, "2": "Juhotyadi",
    /**
     * The fourth gaṇa, whose first dhatu is `div`.
     */
    Divadi: 3, "3": "Divadi",
    /**
     * The fifth gaṇa, whose first dhatu is `su`.
     */
    Svadi: 4, "4": "Svadi",
    /**
     * The sixth gaṇa, whose first dhatu is `tud`.
     */
    Tudadi: 5, "5": "Tudadi",
    /**
     * The seventh gaṇa, whose first dhatu is `ruD`.
     */
    Rudhadi: 6, "6": "Rudhadi",
    /**
     * The eighth gaṇa, whose first dhatu is `tan`.
     */
    Tanadi: 7, "7": "Tanadi",
    /**
     * The ninth gaṇa, whose first dhatu is `krI`.
     */
    Kryadi: 8, "8": "Kryadi",
    /**
     * The tenth gaṇa, whose first dhatu is `cur`.
     */
    Curadi: 9, "9": "Curadi",
    /**
     * The kandvAdi gaṇa, whose first dhatu is `kaRqU`.
     */
    Kandvadi: 10, "10": "Kandvadi",
});
/**
 * The tense/mood of some *tiṅanta*.
 * @enum {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10}
 */
export const Lakara = Object.freeze({
    /**
     * Describes action in the present tense. Ssometimes called the *present indicative*.
     */
    Lat: 0, "0": "Lat",
    /**
     * Describes unwitnessed past action. Sometimes called the *perfect*.
     */
    Lit: 1, "1": "Lit",
    /**
     * Describes future action after the current day. Sometimes called the *periphrastic future*.
     */
    Lut: 2, "2": "Lut",
    /**
     * Describes general future action. Sometimes called the *simple future*.
     */
    Lrt: 3, "3": "Lrt",
    /**
     * The Vedic subjunctive. `vidyut-prakriya` currently has poor support for this lakara.
     */
    Let: 4, "4": "Let",
    /**
     * Describes commands. Sometimes called the *imperative*.
     */
    Lot: 5, "5": "Lot",
    /**
     * Describes past action before the current day. Sometimes called the *imperfect*.
     */
    Lan: 6, "6": "Lan",
    /**
     * Describes potential or hypothetical actions. Sometimes called the *optative*.
     */
    VidhiLin: 7, "7": "VidhiLin",
    /**
     * Describes wishes and prayers. Sometimes called the *benedictive*.
     */
    AshirLin: 8, "8": "AshirLin",
    /**
     * Describes general past action. Sometimes called the *aorist*.
     */
    Lun: 9, "9": "Lun",
    /**
     * Describes past counterfactuals ("would not have ..."). Sometimes called the *conditional*.
     */
    Lrn: 10, "10": "Lrn",
});
/**
 * The gender of some *subanta*.
 * @enum {0 | 1 | 2}
 */
export const Linga = Object.freeze({
    /**
     * The masculine.
     */
    Pum: 0, "0": "Pum",
    /**
     * The feminine.
     */
    Stri: 1, "1": "Stri",
    /**
     * The neuter.
     */
    Napumsaka: 2, "2": "Napumsaka",
});
/**
 * The *prayoga* of some *tiṅanta*.
 *
 * *Prayoga* is roughly similar to the Western concept of verb *voice*.
 * @enum {0 | 1 | 2}
 */
export const Prayoga = Object.freeze({
    /**
     * Usage coreferent with the agent, e.g. "The horse *goes* to the village."
     */
    Kartari: 0, "0": "Kartari",
    /**
     * Usage coreferent with the object, e.g. "The village *is gone to* by the horse."
     */
    Karmani: 1, "1": "Karmani",
    /**
     * Usage without a referent, e.g. "*There is motion* by the horse to the village."
     * *bhāve prayoga* generally produces the same forms as karmani prayoga.
     */
    Bhave: 2, "2": "Bhave",
});
/**
 * The person of some *tiṅanta*.
 * @enum {0 | 1 | 2}
 */
export const Purusha = Object.freeze({
    /**
     * The third person.
     */
    Prathama: 0, "0": "Prathama",
    /**
     * The second person.
     */
    Madhyama: 1, "1": "Madhyama",
    /**
     * The first person.
     */
    Uttama: 2, "2": "Uttama",
});
/**
 * A *sanādi pratyaya*.
 *
 * The *sanādi pratyaya*s create new *dhātu*s per 3.1.32. They are introduced in rules 3.1.7 -
 * 3.1.30, and since rule 3.1.7 contains the word "dhAtoH", they can be called *ārdhadhātuka* by
 * 3.4.114.
 *
 * Any *sanādi pratyaya*s not listed here are required by certain sutras and added by default.
 *
 * For details on what these pratyayas mean and what kinds of words they produce, see the comments
 * below.
 * @enum {0 | 1 | 2 | 3 | 4 | 5 | 6}
 */
export const Sanadi = Object.freeze({
    /**
     * `kAmyac`, which creates nAma-dhAtus per 3.1.9.
     *
     * Examples: `putrakAmyati`
     */
    kAmyac: 0, "0": "kAmyac",
    /**
     * `kyaN`, which creates nAma-dhAtus per 3.1.11.
     *
     * Examples: `SyenAyate`, `BfSAyate`
     */
    kyaN: 1, "1": "kyaN",
    /**
     * `kyac`, which creates nAma-dhAtus per 3.1.8.
     *
     * Examples: `putrIyati`
     */
    kyac: 2, "2": "kyac",
    /**
     * `Nic`, which creates causal roots per 3.1.26.
     *
     * Examples: `BAvayati`, `nAyayati`.
     */
    Ric: 3, "3": "Ric",
    /**
     * `yaN`, which creates intensive roots per 3.1.22. For certain dhatus, the semantics are
     * instead "crooked movement" (by 3.1.23) or "contemptible" action (by 3.1.24).
     *
     * Examples: boBUyate, nenIyate.
     *
     * Constraints: can be used only if the dhatu starts with a consonant and has exactly one
     * vowel. If this constraint is violated, our APIs will return an `Error`.
     */
    yaN: 4, "4": "yaN",
    /**
     * `yaN`, with lopa per 2.4.74. This is often listed separately due to its rarity and its
     * very different form.
     *
     * Examples: boBavIti, boBoti, nenayIti, neneti.
     */
    yaNluk: 5, "5": "yaNluk",
    /**
     * `san`, which creates desiderative roots per 3.1.7.
     *
     * Examples: buBUzati, ninIzati.
     */
    san: 6, "6": "san",
});
/**
 * The complete list of *taddhita pratyaya*s.
 *
 * Rust's naming convention is to start enum values with capital letters. However, we allow mixed
 * case explicitly here so that we can name pratyayas more concisely with SLP1. Doing so helps us
 * distinguish between pratyayas like `naN` and `nan`.
 * @enum {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 | 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59 | 60 | 61 | 62 | 63 | 64 | 65 | 66 | 67 | 68 | 69 | 70 | 71 | 72 | 73 | 74 | 75 | 76 | 77 | 78 | 79 | 80 | 81 | 82 | 83 | 84 | 85 | 86 | 87 | 88 | 89 | 90 | 91 | 92 | 93 | 94 | 95 | 96 | 97 | 98 | 99 | 100 | 101 | 102 | 103 | 104 | 105 | 106 | 107 | 108 | 109 | 110 | 111 | 112 | 113 | 114 | 115 | 116 | 117 | 118 | 119 | 120 | 121 | 122 | 123 | 124 | 125 | 126 | 127 | 128 | 129 | 130 | 131 | 132 | 133 | 134 | 135 | 136 | 137 | 138 | 139 | 140 | 141 | 142 | 143 | 144 | 145 | 146 | 147 | 148 | 149 | 150 | 151 | 152 | 153 | 154 | 155 | 156 | 157 | 158 | 159 | 160 | 161 | 162 | 163 | 164 | 165 | 166 | 167 | 168 | 169 | 170 | 171 | 172 | 173 | 174}
 */
export const Taddhita = Object.freeze({
    /**
     * a
     */
    a: 0, "0": "a",
    /**
     * -aka
     */
    akac: 1, "1": "akac",
    /**
     * -a
     */
    ac: 2, "2": "ac",
    /**
     * -aWa
     */
    aWac: 3, "3": "aWac",
    /**
     * -a
     */
    aR: 4, "4": "aR",
    /**
     * -a
     */
    aY: 5, "5": "aY",
    /**
     * -a
     */
    at: 6, "6": "at",
    /**
     * -atas
     */
    atasuc: 7, "7": "atasuc",
    /**
     * -an
     */
    anic: 8, "8": "anic",
    /**
     * -a
     */
    ap: 9, "9": "ap",
    /**
     * -as
     */
    asic: 10, "10": "asic",
    /**
     * -astAt
     */
    astAti: 11, "11": "astAti",
    /**
     * -Akin
     */
    Akinic: 12, "12": "Akinic",
    /**
     * -Ara
     */
    Arak: 13, "13": "Arak",
    /**
     * -i
     */
    iY: 14, "14": "iY",
    /**
     * -ita
     */
    itac: 15, "15": "itac",
    /**
     * -ina
     */
    inac: 16, "16": "inac",
    /**
     * -in
     */
    ini: 17, "17": "ini",
    /**
     * -iman
     */
    imanic: 18, "18": "imanic",
    /**
     * -ila
     */
    ila: 19, "19": "ila",
    /**
     * -ila
     */
    ilac: 20, "20": "ilac",
    /**
     * -izWa
     */
    izWan: 21, "21": "izWan",
    /**
     * -Ika
     */
    Ikak: 22, "22": "Ikak",
    /**
     * -Ika
     */
    Ikan: 23, "23": "Ikan",
    /**
     * -Iyas
     */
    Iyasun: 24, "24": "Iyasun",
    /**
     * -eRya
     */
    eRya: 25, "25": "eRya",
    /**
     * -Era
     */
    Erak: 26, "26": "Erak",
    /**
     * -ka
     */
    ka: 27, "27": "ka",
    /**
     * -ka
     */
    kak: 28, "28": "kak",
    /**
     * -kawa
     */
    kawac: 29, "29": "kawac",
    /**
     * -ka
     */
    kan: 30, "30": "kan",
    /**
     * -ka
     */
    kap: 31, "31": "kap",
    /**
     * -kalpa
     */
    kalpap: 32, "32": "kalpap",
    /**
     * -kftvas
     */
    kftvasuc: 33, "33": "kftvasuc",
    /**
     * -kuwAra
     */
    kuwArac: 34, "34": "kuwArac",
    /**
     * -kura
     */
    kuRap: 35, "35": "kuRap",
    /**
     * -Ina
     */
    Ka: 36, "36": "Ka",
    /**
     * -Ina
     */
    KaY: 37, "37": "KaY",
    /**
     * -iya
     */
    Ga: 38, "38": "Ga",
    /**
     * -iya
     */
    Gac: 39, "39": "Gac",
    /**
     * -iya
     */
    Gan: 40, "40": "Gan",
    /**
     * -iya
     */
    Gas: 41, "41": "Gas",
    /**
     * -caRa
     */
    caRap: 42, "42": "caRap",
    /**
     * -cara
     */
    caraw: 43, "43": "caraw",
    /**
     * -cuYcu
     */
    cuYcup: 44, "44": "cuYcup",
    /**
     * -Ayana
     */
    cPaY: 45, "45": "cPaY",
    /**
     * --
     */
    cvi: 46, "46": "cvi",
    /**
     * -Iya
     */
    Ca: 47, "47": "Ca",
    /**
     * -Iya
     */
    CaR: 48, "48": "CaR",
    /**
     * -Iya
     */
    Cas: 49, "49": "Cas",
    /**
     * -jAtIya
     */
    jAtIyar: 50, "50": "jAtIyar",
    /**
     * -jAha
     */
    jAhac: 51, "51": "jAhac",
    /**
     * -a
     */
    Ya: 52, "52": "Ya",
    /**
     * -ika
     */
    YiWa: 53, "53": "YiWa",
    /**
     * -ya
     */
    Yya: 54, "54": "Yya",
    /**
     * -ya
     */
    YyaN: 55, "55": "YyaN",
    /**
     * -ya
     */
    Yyaw: 56, "56": "Yyaw",
    /**
     * -a
     */
    wac: 57, "57": "wac",
    /**
     * -a
     */
    waq: 58, "58": "waq",
    /**
     * -iWa
     */
    wiWan: 59, "59": "wiWan",
    /**
     * -wIwa
     */
    wIwac: 60, "60": "wIwac",
    /**
     * -eRya
     */
    weRyaR: 61, "61": "weRyaR",
    /**
     * -ya
     */
    wyaR: 62, "62": "wyaR",
    /**
     * -ana
     */
    wyu: 63, "63": "wyu",
    /**
     * -ana
     */
    wyul: 64, "64": "wyul",
    /**
     * -la
     */
    wlaY: 65, "65": "wlaY",
    /**
     * -ika
     */
    Wak: 66, "66": "Wak",
    /**
     * -ika
     */
    Wac: 67, "67": "Wac",
    /**
     * -ika
     */
    WaY: 68, "68": "WaY",
    /**
     * -ika
     */
    Wan: 69, "69": "Wan",
    /**
     * -ika
     */
    Wap: 70, "70": "Wap",
    /**
     * -a
     */
    qaw: 71, "71": "qaw",
    /**
     * -ati
     */
    qati: 72, "72": "qati",
    /**
     * -atara
     */
    qatarac: 73, "73": "qatarac",
    /**
     * -atama
     */
    qatamac: 74, "74": "qatamac",
    /**
     * -pa
     */
    qupac: 75, "75": "qupac",
    /**
     * -mat
     */
    qmatup: 76, "76": "qmatup",
    /**
     * -ya
     */
    qyaR: 77, "77": "qyaR",
    /**
     * -vala
     */
    qvalac: 78, "78": "qvalac",
    /**
     * -aka
     */
    qvun: 79, "79": "qvun",
    /**
     * -eya
     */
    Qak: 80, "80": "Qak",
    /**
     * -eyaka
     */
    QakaY: 81, "81": "QakaY",
    /**
     * -eya
     */
    Qa: 82, "82": "Qa",
    /**
     * -eya
     */
    QaY: 83, "83": "QaY",
    /**
     * -eyin
     */
    Qinuk: 84, "84": "Qinuk",
    /**
     * -era
     */
    Qrak: 85, "85": "Qrak",
    /**
     * -a
     */
    Ra: 86, "86": "Ra",
    /**
     * -in
     */
    Rini: 87, "87": "Rini",
    /**
     * -ya
     */
    Rya: 88, "88": "Rya",
    /**
     * -tama
     */
    tamap: 89, "89": "tamap",
    /**
     * -taya
     */
    tayap: 90, "90": "tayap",
    /**
     * -tara
     */
    tarap: 91, "91": "tarap",
    /**
     * -ta (becomes -tA)
     */
    tal: 92, "92": "tal",
    /**
     * -tas
     */
    tasi: 93, "93": "tasi",
    /**
     * -tas
     */
    tasil: 94, "94": "tasil",
    /**
     * -ti
     */
    ti: 95, "95": "ti",
    /**
     * -tika
     */
    tikan: 96, "96": "tikan",
    /**
     * -tIya
     */
    tIya: 97, "97": "tIya",
    /**
     * -tya
     */
    tyak: 98, "98": "tyak",
    /**
     * -tyaka
     */
    tyakan: 99, "99": "tyakan",
    /**
     * -tya
     */
    tyap: 100, "100": "tyap",
    /**
     * -tana
     */
    tyu: 101, "101": "tyu",
    /**
     * -tana
     */
    tyul: 102, "102": "tyul",
    /**
     * -tra
     */
    tral: 103, "103": "tral",
    /**
     * -trA
     */
    trA: 104, "104": "trA",
    /**
     * -tva
     */
    tva: 105, "105": "tva",
    /**
     * -Tam
     */
    Tamu: 106, "106": "Tamu",
    /**
     * -Tya
     */
    Tyan: 107, "107": "Tyan",
    /**
     * -TA
     */
    TAl: 108, "108": "TAl",
    /**
     * -daGna
     */
    daGnac: 109, "109": "daGnac",
    /**
     * -dA
     */
    dA: 110, "110": "dA",
    /**
     * -dAnIm
     */
    dAnIm: 111, "111": "dAnIm",
    /**
     * -deSya
     */
    deSya: 112, "112": "deSya",
    /**
     * -deSIya
     */
    deSIyar: 113, "113": "deSIyar",
    /**
     * -dvayasa
     */
    dvayasac: 114, "114": "dvayasac",
    /**
     * -dhA
     */
    DA: 115, "115": "DA",
    /**
     * -na
     */
    na: 116, "116": "na",
    /**
     * -na
     */
    naY: 117, "117": "naY",
    /**
     * -nAwa
     */
    nAwac: 118, "118": "nAwac",
    /**
     * -Ayana
     */
    Pak: 119, "119": "Pak",
    /**
     * -Ayana
     */
    PaY: 120, "120": "PaY",
    /**
     * -Ayani
     */
    PiY: 121, "121": "PiY",
    /**
     * -bahu
     */
    bahuc: 122, "122": "bahuc",
    /**
     * -biqa
     */
    biqac: 123, "123": "biqac",
    /**
     * -birIsa
     */
    birIsac: 124, "124": "birIsac",
    /**
     * -Bakta
     */
    Baktal: 125, "125": "Baktal",
    /**
     * -Brawa
     */
    Brawac: 126, "126": "Brawac",
    /**
     * -ma
     */
    ma: 127, "127": "ma",
    /**
     * -mat
     */
    matup: 128, "128": "matup",
    /**
     * -ma
     */
    map: 129, "129": "map",
    /**
     * -maya
     */
    mayaw: 130, "130": "mayaw",
    /**
     * -mAtra
     */
    mAtrac: 131, "131": "mAtrac",
    /**
     * -pASa
     */
    pASap: 132, "132": "pASap",
    /**
     * -piwa
     */
    piwac: 133, "133": "piwac",
    /**
     * -ya
     */
    ya: 134, "134": "ya",
    /**
     * -ya
     */
    yak: 135, "135": "yak",
    /**
     * -ya
     */
    yaY: 136, "136": "yaY",
    /**
     * -ya
     */
    yat: 137, "137": "yat",
    /**
     * -ya
     */
    yan: 138, "138": "yan",
    /**
     * -yu
     */
    yus: 139, "139": "yus",
    /**
     * -ra
     */
    ra: 140, "140": "ra",
    /**
     * -rUpa
     */
    rUpap: 141, "141": "rUpap",
    /**
     * -rhi
     */
    rhil: 142, "142": "rhil",
    /**
     * -rUpya
     */
    rUpya: 143, "143": "rUpya",
    /**
     * -la
     */
    lac: 144, "144": "lac",
    /**
     * -vat
     */
    vati: 145, "145": "vati",
    /**
     * -vat
     */
    vatup: 146, "146": "vatup",
    /**
     * -vaya
     */
    vaya: 147, "147": "vaya",
    /**
     * -vala
     */
    valac: 148, "148": "valac",
    /**
     * -vin
     */
    vini: 149, "149": "vini",
    /**
     * -viDu
     */
    viDal: 150, "150": "viDal",
    /**
     * -aka
     */
    vuk: 151, "151": "vuk",
    /**
     * -aka
     */
    vuY: 152, "152": "vuY",
    /**
     * -aka
     */
    vun: 153, "153": "vun",
    /**
     * -vya
     */
    vyat: 154, "154": "vyat",
    /**
     * -vya
     */
    vyan: 155, "155": "vyan",
    /**
     * -Sa
     */
    Sa: 156, "156": "Sa",
    /**
     * -SaNkawa
     */
    SaNkawac: 157, "157": "SaNkawac",
    /**
     * -SAla
     */
    SAlac: 158, "158": "SAlac",
    /**
     * -Sas
     */
    Sas: 159, "159": "Sas",
    /**
     * -za
     */
    za: 160, "160": "za",
    /**
     * -ka
     */
    zkan: 161, "161": "zkan",
    /**
     * -tara
     */
    zwarac: 162, "162": "zwarac",
    /**
     * -ika
     */
    zWac: 163, "163": "zWac",
    /**
     * -ika
     */
    zWan: 164, "164": "zWan",
    /**
     * -ika
     */
    zWal: 165, "165": "zWal",
    /**
     * Ayana
     */
    zPak: 166, "166": "zPak",
    /**
     * -ya
     */
    zyaN: 167, "167": "zyaN",
    /**
     * -ya
     */
    zyaY: 168, "168": "zyaY",
    /**
     * -sa
     */
    sa: 169, "169": "sa",
    /**
     * -sna
     */
    sna: 170, "170": "sna",
    /**
     * -sAt
     */
    sAti: 171, "171": "sAti",
    /**
     * -s
     */
    suc: 172, "172": "suc",
    /**
     * -sna
     */
    snaY: 173, "173": "snaY",
    /**
     * -ha
     */
    ha: 174, "174": "ha",
});
/**
 * The complete list of *uṇādi pratyaya*s.
 *
 * Rust's naming convention is to start enum values with capital letters. However, we allow mixed
 * case explicitly here so that we can name pratyayas more concisely with SLP1. Doing so helps us
 * distinguish between pratyayas like `naN` and `nan`.
 *
 * NOTE: we generated this list programmatically. Many of these pratyayas have typos.
 * @enum {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 | 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59 | 60 | 61 | 62 | 63 | 64 | 65 | 66 | 67 | 68 | 69 | 70 | 71 | 72 | 73 | 74 | 75 | 76 | 77 | 78 | 79 | 80 | 81 | 82 | 83 | 84 | 85 | 86 | 87 | 88 | 89 | 90 | 91 | 92 | 93 | 94 | 95 | 96 | 97 | 98 | 99 | 100 | 101 | 102 | 103 | 104 | 105 | 106 | 107 | 108 | 109 | 110 | 111 | 112 | 113 | 114 | 115 | 116 | 117 | 118 | 119 | 120 | 121 | 122 | 123 | 124 | 125 | 126 | 127 | 128 | 129 | 130 | 131 | 132 | 133 | 134 | 135 | 136 | 137 | 138 | 139 | 140 | 141 | 142 | 143 | 144 | 145 | 146 | 147 | 148 | 149 | 150 | 151 | 152 | 153 | 154 | 155 | 156 | 157 | 158 | 159 | 160 | 161 | 162 | 163 | 164 | 165 | 166 | 167 | 168 | 169 | 170 | 171 | 172 | 173 | 174 | 175 | 176 | 177 | 178 | 179 | 180 | 181 | 182 | 183 | 184 | 185 | 186 | 187 | 188 | 189 | 190 | 191 | 192 | 193 | 194 | 195 | 196 | 197 | 198 | 199 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 209 | 210 | 211 | 212 | 213 | 214 | 215 | 216 | 217 | 218 | 219 | 220 | 221 | 222 | 223 | 224 | 225 | 226 | 227 | 228 | 229 | 230 | 231 | 232 | 233 | 234 | 235 | 236 | 237 | 238 | 239 | 240 | 241 | 242 | 243 | 244 | 245 | 246 | 247 | 248 | 249 | 250 | 251 | 252 | 253 | 254 | 255 | 256 | 257 | 258 | 259 | 260 | 261 | 262 | 263 | 264 | 265 | 266 | 267 | 268 | 269 | 270 | 271 | 272 | 273 | 274 | 275 | 276 | 277 | 278 | 279 | 280 | 281 | 282 | 283 | 284 | 285 | 286 | 287 | 288 | 289 | 290 | 291 | 292 | 293 | 294 | 295 | 296 | 297 | 298 | 299 | 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308 | 309 | 310 | 311}
 */
export const Unadi = Object.freeze({
    /**
     * -a
     */
    a: 0, "0": "a",
    /**
     * -aknu
     */
    aknuc: 1, "1": "aknuc",
    /**
     * -aNga
     */
    aNgac: 2, "2": "aNgac",
    /**
     * -adAnu
     */
    radAnuk: 3, "3": "radAnuk",
    /**
     * -a
     */
    ac: 4, "4": "ac",
    /**
     * -aj
     */
    aji: 5, "5": "aji",
    /**
     * -awa
     */
    awan: 6, "6": "awan",
    /**
     * -aw
     */
    awi: 7, "7": "awi",
    /**
     * -aWa
     */
    aWa: 8, "8": "aWa",
    /**
     * -aRqa
     */
    aRqan: 9, "9": "aRqan",
    /**
     * -ata
     */
    atac: 10, "10": "atac",
    /**
     * -at
     */
    ati: 11, "11": "ati",
    /**
     * -ati
     */
    ati_: 12, "12": "ati_",
    /**
     * -atra
     */
    atran: 13, "13": "atran",
    /**
     * -atri
     */
    atrin: 14, "14": "atrin",
    /**
     * -aTa
     */
    aTa: 15, "15": "aTa",
    /**
     * -ad
     */
    adi: 16, "16": "adi",
    /**
     * -a
     */
    an: 17, "17": "an",
    /**
     * -ani
     */
    ani: 18, "18": "ani",
    /**
     * -anu
     */
    anuN: 19, "19": "anuN",
    /**
     * -anya
     */
    anya: 20, "20": "anya",
    /**
     * -anyu
     */
    anyuc: 21, "21": "anyuc",
    /**
     * -apa
     */
    apa: 22, "22": "apa",
    /**
     * -abaka
     */
    abaka: 23, "23": "abaka",
    /**
     * -amba
     */
    ambac: 24, "24": "ambac",
    /**
     * -aBa
     */
    aBac: 25, "25": "aBac",
    /**
     * -ama
     */
    ama: 26, "26": "ama",
    /**
     * -ama (praTama)
     */
    amac: 27, "27": "amac",
    /**
     * -amba
     */
    ambaj: 28, "28": "ambaj",
    /**
     * -ayu
     */
    ayu: 29, "29": "ayu",
    /**
     * -ara
     */
    ara: 30, "30": "ara",
    /**
     * -ara
     */
    aran: 31, "31": "aran",
    /**
     * -ar
     */
    aran_: 32, "32": "aran_",
    /**
     * -aru
     */
    aru: 33, "33": "aru",
    /**
     * -a
     */
    al: 34, "34": "al",
    /**
     * -ala (maNgala)
     */
    alac: 35, "35": "alac",
    /**
     * -ali
     */
    alic: 36, "36": "alic",
    /**
     * -avi
     */
    avi: 37, "37": "avi",
    /**
     * -a
     */
    asa: 38, "38": "asa",
    /**
     * -asa
     */
    asac: 39, "39": "asac",
    /**
     * -asAna
     */
    asAnac: 40, "40": "asAnac",
    /**
     * -as
     */
    asi: 41, "41": "asi",
    /**
     * -as (cetas)
     */
    asun: 42, "42": "asun",
    /**
     * -A
     */
    A: 43, "43": "A",
    /**
     * -Aka
     */
    Aka: 44, "44": "Aka",
    /**
     * -AgU
     */
    AgUc: 45, "45": "AgUc",
    /**
     * -Awa
     */
    Awac: 46, "46": "Awac",
    /**
     * -ARaka
     */
    ARaka: 47, "47": "ARaka",
    /**
     * -Atu
     */
    Atu: 48, "48": "Atu",
    /**
     * -Atfka
     */
    Atfkan: 49, "49": "Atfkan",
    /**
     * -Anaka
     */
    Anaka: 50, "50": "Anaka",
    /**
     * -Ana
     */
    Anac: 51, "51": "Anac",
    /**
     * -Anu
     */
    Anuk: 52, "52": "Anuk",
    /**
     * -Anya
     */
    Anya: 53, "53": "Anya",
    /**
     * -Ayya
     */
    Ayya: 54, "54": "Ayya",
    /**
     * -Ara
     */
    Aran: 55, "55": "Aran",
    /**
     * -Ala
     */
    Ala: 56, "56": "Ala",
    /**
     * -Ala
     */
    Alac: 57, "57": "Alac",
    /**
     * -Ala
     */
    AlaY: 58, "58": "AlaY",
    /**
     * -AlIya
     */
    AlIyac: 59, "59": "AlIyac",
    /**
     * -A
     */
    Asa: 60, "60": "Asa",
    /**
     * -As
     */
    Asi: 61, "61": "Asi",
    /**
     * -i
     */
    i: 62, "62": "i",
    /**
     * -ika
     */
    ikan: 63, "63": "ikan",
    /**
     * -ij
     */
    iji: 64, "64": "iji",
    /**
     * -i
     */
    iY: 65, "65": "iY",
    /**
     * -i
     */
    iR: 66, "66": "iR",
    /**
     * -ita
     */
    ita: 67, "67": "ita",
    /**
     * -ita
     */
    itac: 68, "68": "itac",
    /**
     * -ita
     */
    itan: 69, "69": "itan",
    /**
     * -it
     */
    iti: 70, "70": "iti",
    /**
     * -itnu
     */
    itnuc: 71, "71": "itnuc",
    /**
     * -itra
     */
    itra: 72, "72": "itra",
    /**
     * -itva
     */
    itvan: 73, "73": "itvan",
    /**
     * -iTi
     */
    iTin: 74, "74": "iTin",
    /**
     * -i
     */
    in_: 75, "75": "in_",
    /**
     * -ina
     */
    inac: 76, "76": "inac",
    /**
     * -ina
     */
    inaR: 77, "77": "inaR",
    /**
     * -ina
     */
    inan: 78, "78": "inan",
    /**
     * -in
     */
    ini: 79, "79": "ini",
    /**
     * -iman
     */
    imanic: 80, "80": "imanic",
    /**
     * -iman
     */
    imanin: 81, "81": "imanin",
    /**
     * -ila
     */
    ilac: 82, "82": "ilac",
    /**
     * -izWa
     */
    izWac: 83, "83": "izWac",
    /**
     * -izWu
     */
    izWuc: 84, "84": "izWuc",
    /**
     * -izRu
     */
    izRuc: 85, "85": "izRuc",
    /**
     * -isa
     */
    isan: 86, "86": "isan",
    /**
     * -is
     */
    isi: 87, "87": "isi",
    /**
     * -is
     */
    isin: 88, "88": "isin",
    /**
     * -I
     */
    I: 89, "89": "I",
    /**
     * -Ika
     */
    Ikan: 90, "90": "Ikan",
    /**
     * -Ici
     */
    Ici: 91, "91": "Ici",
    /**
     * -Ida
     */
    Ida: 92, "92": "Ida",
    /**
     * -Ira
     */
    Irac: 93, "93": "Irac",
    /**
     * -Ira
     */
    Iran: 94, "94": "Iran",
    /**
     * -Iza
     */
    Izan: 95, "95": "Izan",
    /**
     * -u
     */
    u: 96, "96": "u",
    /**
     * -uka
     */
    ukan: 97, "97": "ukan",
    /**
     * -uqa
     */
    uqac: 98, "98": "uqac",
    /**
     * -u
     */
    uR: 99, "99": "uR",
    /**
     * -ut
     */
    uti: 100, "100": "uti",
    /**
     * -utra
     */
    utra: 101, "101": "utra",
    /**
     * -una
     */
    una: 102, "102": "una",
    /**
     * -una
     */
    unan: 103, "103": "unan",
    /**
     * -unas
     */
    unasi: 104, "104": "unasi",
    /**
     * -uni
     */
    uni: 105, "105": "uni",
    /**
     * -unta
     */
    unta: 106, "106": "unta",
    /**
     * -unti
     */
    unti: 107, "107": "unti",
    /**
     * -uma
     */
    uma: 108, "108": "uma",
    /**
     * -umBa
     */
    umBa: 109, "109": "umBa",
    /**
     * -ura
     */
    urac: 110, "110": "urac",
    /**
     * -ura
     */
    uran: 111, "111": "uran",
    /**
     * -ur
     */
    uran_: 112, "112": "uran_",
    /**
     * -uri
     */
    urin: 113, "113": "urin",
    /**
     * -ula
     */
    ulac: 114, "114": "ulac",
    /**
     * -uli
     */
    uli: 115, "115": "uli",
    /**
     * -uza
     */
    uzac: 116, "116": "uzac",
    /**
     * -us (Danus)
     */
    usi: 117, "117": "usi",
    /**
     * -U
     */
    U: 118, "118": "U",
    /**
     * -Uka
     */
    Uka: 119, "119": "Uka",
    /**
     * -Uka
     */
    UkaR: 120, "120": "UkaR",
    /**
     * -UKa
     */
    UKa: 121, "121": "UKa",
    /**
     * -UTa
     */
    UTan: 122, "122": "UTan",
    /**
     * -Uma
     */
    Uma: 123, "123": "Uma",
    /**
     * -U
     */
    Ur: 124, "124": "Ur",
    /**
     * -Ura
     */
    Uran: 125, "125": "Uran",
    /**
     * -Uza
     */
    Uzan: 126, "126": "Uzan",
    /**
     * -f
     */
    f: 127, "127": "f",
    /**
     * -ft
     */
    ftin: 128, "128": "ftin",
    /**
     * -f
     */
    fn_: 129, "129": "fn_",
    /**
     * -eRu
     */
    eRu: 130, "130": "eRu",
    /**
     * -eRya
     */
    eRya: 131, "131": "eRya",
    /**
     * -era
     */
    erak: 132, "132": "erak",
    /**
     * -elima
     */
    elimac: 133, "133": "elimac",
    /**
     * -ota
     */
    otac: 134, "134": "otac",
    /**
     * -ora
     */
    oran: 135, "135": "oran",
    /**
     * -ola
     */
    olac: 136, "136": "olac",
    /**
     * -ka
     */
    ka: 137, "137": "ka",
    /**
     * -ka
     */
    kak: 138, "138": "kak",
    /**
     * -kaNkaRa
     */
    kaNkaRa: 139, "139": "kaNkaRa",
    /**
     * -kaRa
     */
    kaRa: 140, "140": "kaRa",
    /**
     * -katu
     */
    katu: 141, "141": "katu",
    /**
     * -katni
     */
    katnic: 142, "142": "katnic",
    /**
     * -katra
     */
    katra: 143, "143": "katra",
    /**
     * -kTa
     */
    kTan: 144, "144": "kTan",
    /**
     * -ka
     */
    kan: 145, "145": "kan",
    /**
     * -anas
     */
    kanasi: 146, "146": "kanasi",
    /**
     * -an
     */
    kanin: 147, "147": "kanin",
    /**
     * -kanu
     */
    kanum: 148, "148": "kanum",
    /**
     * -kanya
     */
    kanyan: 149, "149": "kanyan",
    /**
     * -kanyu
     */
    kanyuc: 150, "150": "kanyuc",
    /**
     * -kapa
     */
    kapa: 151, "151": "kapa",
    /**
     * -kapa
     */
    kapan: 152, "152": "kapan",
    /**
     * -am
     */
    kamin: 153, "153": "kamin",
    /**
     * -kaya
     */
    kayan: 154, "154": "kayan",
    /**
     * -kara
     */
    karan: 155, "155": "karan",
    /**
     * -kala
     */
    kala: 156, "156": "kala",
    /**
     * -kAku
     */
    kAku: 157, "157": "kAku",
    /**
     * -kAla
     */
    kAlan: 158, "158": "kAlan",
    /**
     * -ika
     */
    kikan: 159, "159": "kikan",
    /**
     * -kita
     */
    kitac: 160, "160": "kitac",
    /**
     * -kinda
     */
    kindac: 161, "161": "kindac",
    /**
     * -kira
     */
    kirac: 162, "162": "kirac",
    /**
     * -kizya
     */
    kizyan: 163, "163": "kizyan",
    /**
     * -kIka
     */
    kIkac: 164, "164": "kIkac",
    /**
     * -kIka
     */
    kIkan: 165, "165": "kIkan",
    /**
     * -kIwa
     */
    kIwan: 166, "166": "kIwan",
    /**
     * -ku
     */
    ku: 167, "167": "ku",
    /**
     * -ku
     */
    kuk: 168, "168": "kuk",
    /**
     * -kuka
     */
    kukan: 169, "169": "kukan",
    /**
     * -kuza
     */
    kuzan: 170, "170": "kuzan",
    /**
     * -kU
     */
    kU: 171, "171": "kU",
    /**
     * -kta
     */
    kta: 172, "172": "kta",
    /**
     * -ktnu
     */
    ktnu: 173, "173": "ktnu",
    /**
     * -ktra
     */
    ktra: 174, "174": "ktra",
    /**
     * -kTi
     */
    kTin: 175, "175": "kTin",
    /**
     * -kna
     */
    kna: 176, "176": "kna",
    /**
     * -kni
     */
    knin: 177, "177": "knin",
    /**
     * -kmala
     */
    kmalan: 178, "178": "kmalan",
    /**
     * -ana
     */
    kyu: 179, "179": "kyu",
    /**
     * -ana
     */
    kyun: 180, "180": "kyun",
    /**
     * -kra
     */
    kran: 181, "181": "kran",
    /**
     * -krara
     */
    kraran: 182, "182": "kraran",
    /**
     * -kri
     */
    kri: 183, "183": "kri",
    /**
     * -kri
     */
    krin: 184, "184": "krin",
    /**
     * -ruka
     */
    krukan: 185, "185": "krukan",
    /**
     * -kru
     */
    krun: 186, "186": "krun",
    /**
     * -kla
     */
    kla: 187, "187": "kla",
    /**
     * -kva
     */
    kvan: 188, "188": "kvan",
    /**
     * -van
     */
    kvanip: 189, "189": "kvanip",
    /**
     * -kvi
     */
    kvin: 190, "190": "kvin",
    /**
     * -
     */
    kvip: 191, "191": "kvip",
    /**
     * -aka
     */
    kvun: 192, "192": "kvun",
    /**
     * -ksara
     */
    ksaran: 193, "193": "ksaran",
    /**
     * -ksi
     */
    ksi: 194, "194": "ksi",
    /**
     * -ksu
     */
    ksu: 195, "195": "ksu",
    /**
     * -kseyya
     */
    kseyya: 196, "196": "kseyya",
    /**
     * -ksna
     */
    ksna: 197, "197": "ksna",
    /**
     * -Ka
     */
    Ka: 198, "198": "Ka",
    /**
     * -ga
     */
    ga: 199, "199": "ga",
    /**
     * -ga
     */
    gak: 200, "200": "gak",
    /**
     * -ga
     */
    gaR: 201, "201": "gaR",
    /**
     * -ga
     */
    gan: 202, "202": "gan",
    /**
     * -GaTi
     */
    GaTin: 203, "203": "GaTin",
    /**
     * -ca
     */
    caw: 204, "204": "caw",
    /**
     * -catu
     */
    catu: 205, "205": "catu",
    /**
     * -c
     */
    cik: 206, "206": "cik",
    /**
     * -Ja
     */
    Jac: 207, "207": "Jac",
    /**
     * -Ji
     */
    Jic: 208, "208": "Jic",
    /**
     * -Yu
     */
    YuR: 209, "209": "YuR",
    /**
     * -wa
     */
    wa: 210, "210": "wa",
    /**
     * -wa
     */
    wan: 211, "211": "wan",
    /**
     * -wiza
     */
    wizac: 212, "212": "wizac",
    /**
     * -Wa
     */
    Wa: 213, "213": "Wa",
    /**
     * -qa
     */
    qa: 214, "214": "qa",
    /**
     * -qau
     */
    qau: 215, "215": "qau",
    /**
     * -ra
     */
    qraw: 216, "216": "qraw",
    /**
     * -qati
     */
    qati: 217, "217": "qati",
    /**
     * -avat
     */
    qavatu: 218, "218": "qavatu",
    /**
     * -qim
     */
    qimi: 219, "219": "qimi",
    /**
     * -quta
     */
    qutac: 220, "220": "qutac",
    /**
     * -qu
     */
    qun: 221, "221": "qun",
    /**
     * -ums
     */
    qumsun: 222, "222": "qumsun",
    /**
     * -U
     */
    qU: 223, "223": "qU",
    /**
     * -E
     */
    qE: 224, "224": "qE",
    /**
     * -Es
     */
    qEsi: 225, "225": "qEsi",
    /**
     * -o
     */
    qo: 226, "226": "qo",
    /**
     * -os
     */
    qosi: 227, "227": "qosi",
    /**
     * -O
     */
    qO: 228, "228": "qO",
    /**
     * -qri
     */
    qri: 229, "229": "qri",
    /**
     * -Qa
     */
    Qa: 230, "230": "Qa",
    /**
     * -Ritra
     */
    Ritran: 231, "231": "Ritran",
    /**
     * -Ru
     */
    Ru: 232, "232": "Ru",
    /**
     * -Ruka
     */
    Rukan: 233, "233": "Rukan",
    /**
     * -ta
     */
    ta: 234, "234": "ta",
    /**
     * -taka
     */
    takan: 235, "235": "takan",
    /**
     * -ta
     */
    tan: 236, "236": "tan",
    /**
     * -tana
     */
    tanan: 237, "237": "tanan",
    /**
     * -taSa
     */
    taSan: 238, "238": "taSan",
    /**
     * -taSas
     */
    taSasun: 239, "239": "taSasun",
    /**
     * -ti
     */
    ti: 240, "240": "ti",
    /**
     * -tika
     */
    tikan: 241, "241": "tikan",
    /**
     * -tu
     */
    tu: 242, "242": "tu",
    /**
     * -tu
     */
    tun: 243, "243": "tun",
    /**
     * -tf
     */
    tfc: 244, "244": "tfc",
    /**
     * -tf
     */
    tfn: 245, "245": "tfn",
    /**
     * -tna
     */
    tnaR: 246, "246": "tnaR",
    /**
     * -tyu
     */
    tyuk: 247, "247": "tyuk",
    /**
     * -tra
     */
    tra: 248, "248": "tra",
    /**
     * -tra
     */
    tran: 249, "249": "tran",
    /**
     * -tri
     */
    trin: 250, "250": "trin",
    /**
     * -tri
     */
    trip: 251, "251": "trip",
    /**
     * -tva
     */
    tvan: 252, "252": "tvan",
    /**
     * -Ta
     */
    Tak: 253, "253": "Tak",
    /**
     * -da
     */
    da: 254, "254": "da",
    /**
     * -da
     */
    dan: 255, "255": "dan",
    /**
     * -Du
     */
    Duk: 256, "256": "Duk",
    /**
     * -na
     */
    na: 257, "257": "na",
    /**
     * -na
     */
    nak: 258, "258": "nak",
    /**
     * -ni
     */
    ni: 259, "259": "ni",
    /**
     * -nu
     */
    nu: 260, "260": "nu",
    /**
     * -pa
     */
    pa: 261, "261": "pa",
    /**
     * -pAsa
     */
    pAsa: 262, "262": "pAsa",
    /**
     * -Pa
     */
    Pak: 263, "263": "Pak",
    /**
     * -ba
     */
    ban: 264, "264": "ban",
    /**
     * -Ba
     */
    Ba: 265, "265": "Ba",
    /**
     * -Ba
     */
    Ban: 266, "266": "Ban",
    /**
     * -ma
     */
    mak: 267, "267": "mak",
    /**
     * -madi
     */
    madik: 268, "268": "madik",
    /**
     * -ma
     */
    man: 269, "269": "man",
    /**
     * -man
     */
    mani: 270, "270": "mani",
    /**
     * -man
     */
    maniR: 271, "271": "maniR",
    /**
     * -man
     */
    manin: 272, "272": "manin",
    /**
     * -mi
     */
    mi: 273, "273": "mi",
    /**
     * -mi
     */
    min: 274, "274": "min",
    /**
     * -mu
     */
    muk: 275, "275": "muk",
    /**
     * -ya
     */
    ya: 276, "276": "ya",
    /**
     * -ya
     */
    yak: 277, "277": "yak",
    /**
     * -ya
     */
    yat: 278, "278": "yat",
    /**
     * -yatu
     */
    yatuc: 279, "279": "yatuc",
    /**
     * -yu
     */
    yuk: 280, "280": "yuk",
    /**
     * -ana
     */
    yuc: 281, "281": "yuc",
    /**
     * -ana
     */
    yun: 282, "282": "yun",
    /**
     * -ra
     */
    ra: 283, "283": "ra",
    /**
     * -ra
     */
    rak: 284, "284": "rak",
    /**
     * -ra
     */
    ran: 285, "285": "ran",
    /**
     * -ru
     */
    ru: 286, "286": "ru",
    /**
     * -la
     */
    lak: 287, "287": "lak",
    /**
     * -va
     */
    va: 288, "288": "va",
    /**
     * -va
     */
    vaR: 289, "289": "vaR",
    /**
     * -va
     */
    van: 290, "290": "van",
    /**
     * -van
     */
    vanip: 291, "291": "vanip",
    /**
     * -vara
     */
    varaw: 292, "292": "varaw",
    /**
     * -vala
     */
    valaY: 293, "293": "valaY",
    /**
     * -vAla
     */
    vAlac: 294, "294": "vAlac",
    /**
     * -vAla
     */
    vAlan: 295, "295": "vAlan",
    /**
     * -vi
     */
    vin: 296, "296": "vin",
    /**
     * -aka
     */
    vun: 297, "297": "vun",
    /**
     * -Sa
     */
    Sak: 298, "298": "Sak",
    /**
     * -Su
     */
    Sun: 299, "299": "Sun",
    /**
     * -Sva
     */
    SvaR: 300, "300": "SvaR",
    /**
     * -ziva
     */
    zivan: 301, "301": "zivan",
    /**
     * -zwra
     */
    zwran: 302, "302": "zwran",
    /**
     * -zvara
     */
    zvarac: 303, "303": "zvarac",
    /**
     * -sa
     */
    sa: 304, "304": "sa",
    /**
     * -sa
     */
    san: 305, "305": "san",
    /**
     * -sara
     */
    sara: 306, "306": "sara",
    /**
     * -sika
     */
    sikan: 307, "307": "sikan",
    /**
     * -sTa
     */
    sTan: 308, "308": "sTan",
    /**
     * -sma
     */
    sman: 309, "309": "sman",
    /**
     * -sya
     */
    sya: 310, "310": "sya",
    /**
     * -sya
     */
    syan: 311, "311": "syan",
});
/**
 * The number of some *tiṅanta* or *subanta*.
 * @enum {0 | 1 | 2}
 */
export const Vacana = Object.freeze({
    /**
     * The singular.
     */
    Eka: 0, "0": "Eka",
    /**
     * The dual.
     */
    Dvi: 1, "1": "Dvi",
    /**
     * The plural.
     */
    Bahu: 2, "2": "Bahu",
});
/**
 * The case ending of some *subanta*.
 *
 * A *vibhakti* is a set of 3 endings that share all of the same properties except for their
 * number (singular, dual, plural). While *tiṅanta*s also have *vibhakti*s, in practice the term
 * *vibhakti* refers more specifically to the endings used with *subanta*s.
 *
 * *Vibhakti* is broadly similar to the Western notion of grammatical case.
 * @enum {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7}
 */
export const Vibhakti = Object.freeze({
    /**
     * The first *vibhakti*. Sometimes called the *nominative case*.
     */
    Prathama: 0, "0": "Prathama",
    /**
     * The second *vibhakti*. Sometimes called the *accusative case*.
     */
    Dvitiya: 1, "1": "Dvitiya",
    /**
     * The third *vibhakti*. Sometimes called the *instrumental case*.
     */
    Trtiya: 2, "2": "Trtiya",
    /**
     * The fourth *vibhakti*. Sometimes called the *dative case*.
     */
    Caturthi: 3, "3": "Caturthi",
    /**
     * The fifth *vibhakti*. Sometimes called the *ablative case*.
     */
    Panchami: 4, "4": "Panchami",
    /**
     * The sixth *vibhakti*. Sometimes called the *genitive case*.
     */
    Sasthi: 5, "5": "Sasthi",
    /**
     * The seventh *vibhakti*. Sometimes called the *locative case*.
     */
    Saptami: 6, "6": "Saptami",
    /**
     * The first *vibhakti* used in the sense of *sambodhana*. Sometimes called the *vocative case*.
     *
     * *Sambodhana* is technically not a *vibhakti* but rather an additional semantic condition
     * on the first vibhakti. But we felt that users would find it more convenient to have this
     * condition available on `Vibhakti` directly rather than have to define the *sambodhana*
     * condition separately.
     */
    Sambodhana: 7, "7": "Sambodhana",
});

const VidyutFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_vidyut_free(ptr >>> 0, 1));
/**
 * WebAssembly API for vidyut-prakriya.
 *
 * Within reason, we have tried to mimic a native JavaScript API. At some point, we wish to
 * support optional arguments, perhaps by using `Reflect`.
 */
export class Vidyut {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Vidyut.prototype);
        obj.__wbg_ptr = ptr;
        VidyutFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        VidyutFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_vidyut_free(ptr, 0);
    }
    /**
     * Creates a new API manager.
     *
     * This constructor is not called `new` because `new` is a reserved word in JavaScript.
     * @returns {Vidyut}
     */
    static init() {
        const ret = wasm.vidyut_init();
        return Vidyut.__wrap(ret);
    }
    /**
     * Wrapper for `Vyakarana::derive_krdantas`.
     * @param {any} val
     * @returns {any}
     */
    deriveKrdantas(val) {
        const ret = wasm.vidyut_deriveKrdantas(this.__wbg_ptr, val);
        return ret;
    }
    /**
     * Wrapper for `Vyakarana::derive_dhatus`.
     * @param {any} val
     * @returns {any}
     */
    deriveDhatus(val) {
        const ret = wasm.vidyut_deriveDhatus(this.__wbg_ptr, val);
        return ret;
    }
    /**
     * Wrapper for `Vyakarana::derive_subantas`.
     * @param {any} val
     * @returns {any}
     */
    deriveSubantas(val) {
        const ret = wasm.vidyut_deriveSubantas(this.__wbg_ptr, val);
        return ret;
    }
    /**
     * Wrapper for `Vyakarana::derive_tinantas`.
     *
     * TODO: how might we reduce the number of arguments here?
     * @param {any} val
     * @returns {any}
     */
    deriveTinantas(val) {
        const ret = wasm.vidyut_deriveTinantas(this.__wbg_ptr, val);
        return ret;
    }
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg_buffer_61b7ce01341d7f88 = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_call_b0d8e36992d9900d = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.call(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_done_f22c1561fa919baa = function(arg0) {
        const ret = arg0.done;
        return ret;
    };
    imports.wbg.__wbg_entries_4f2bb9b0d701c0f6 = function(arg0) {
        const ret = Object.entries(arg0);
        return ret;
    };
    imports.wbg.__wbg_error_31ad3319a77f040e = function(arg0, arg1) {
        console.error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_error_7534b8e9a36f1ab4 = function(arg0, arg1) {
        let deferred0_0;
        let deferred0_1;
        try {
            deferred0_0 = arg0;
            deferred0_1 = arg1;
            console.error(getStringFromWasm0(arg0, arg1));
        } finally {
            wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
        }
    };
    imports.wbg.__wbg_get_9aa3dff3f0266054 = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbg_get_bbccf8970793c087 = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.get(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getwithrefkey_bb8f74a92cb2e784 = function(arg0, arg1) {
        const ret = arg0[arg1];
        return ret;
    };
    imports.wbg.__wbg_instanceof_ArrayBuffer_670ddde44cdb2602 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof ArrayBuffer;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Uint8Array_28af5bc19d6acad8 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Uint8Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_isArray_1ba11a930108ec51 = function(arg0) {
        const ret = Array.isArray(arg0);
        return ret;
    };
    imports.wbg.__wbg_iterator_23604bb983791576 = function() {
        const ret = Symbol.iterator;
        return ret;
    };
    imports.wbg.__wbg_length_65d1cd11729ced11 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_d65cf0786bfc5739 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_new_254fa9eac11932ae = function() {
        const ret = new Array();
        return ret;
    };
    imports.wbg.__wbg_new_3ff5b33b1ce712df = function(arg0) {
        const ret = new Uint8Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_688846f374351c92 = function() {
        const ret = new Object();
        return ret;
    };
    imports.wbg.__wbg_new_8a6f238a6ece86ea = function() {
        const ret = new Error();
        return ret;
    };
    imports.wbg.__wbg_next_01dd9234a5bf6d05 = function() { return handleError(function (arg0) {
        const ret = arg0.next();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_next_137428deb98342b0 = function(arg0) {
        const ret = arg0.next;
        return ret;
    };
    imports.wbg.__wbg_set_1d80752d0d5f0b21 = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2;
    };
    imports.wbg.__wbg_set_23d69db4e5c66a6e = function(arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_set_3fda3bac07393de4 = function(arg0, arg1, arg2) {
        arg0[arg1] = arg2;
    };
    imports.wbg.__wbg_stack_0ed75d68575b0f3c = function(arg0, arg1) {
        const ret = arg1.stack;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_value_4c32fd138a88eee2 = function(arg0) {
        const ret = arg0.value;
        return ret;
    };
    imports.wbg.__wbindgen_boolean_get = function(arg0) {
        const v = arg0;
        const ret = typeof(v) === 'boolean' ? (v ? 1 : 0) : 2;
        return ret;
    };
    imports.wbg.__wbindgen_debug_string = function(arg0, arg1) {
        const ret = debugString(arg1);
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbindgen_error_new = function(arg0, arg1) {
        const ret = new Error(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbindgen_in = function(arg0, arg1) {
        const ret = arg0 in arg1;
        return ret;
    };
    imports.wbg.__wbindgen_init_externref_table = function() {
        const table = wasm.__wbindgen_export_2;
        const offset = table.grow(4);
        table.set(0, undefined);
        table.set(offset + 0, undefined);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
        ;
    };
    imports.wbg.__wbindgen_is_function = function(arg0) {
        const ret = typeof(arg0) === 'function';
        return ret;
    };
    imports.wbg.__wbindgen_is_object = function(arg0) {
        const val = arg0;
        const ret = typeof(val) === 'object' && val !== null;
        return ret;
    };
    imports.wbg.__wbindgen_is_string = function(arg0) {
        const ret = typeof(arg0) === 'string';
        return ret;
    };
    imports.wbg.__wbindgen_is_undefined = function(arg0) {
        const ret = arg0 === undefined;
        return ret;
    };
    imports.wbg.__wbindgen_jsval_loose_eq = function(arg0, arg1) {
        const ret = arg0 == arg1;
        return ret;
    };
    imports.wbg.__wbindgen_memory = function() {
        const ret = wasm.memory;
        return ret;
    };
    imports.wbg.__wbindgen_number_get = function(arg0, arg1) {
        const obj = arg1;
        const ret = typeof(obj) === 'number' ? obj : undefined;
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbindgen_string_get = function(arg0, arg1) {
        const obj = arg1;
        const ret = typeof(obj) === 'string' ? obj : undefined;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
        const ret = getStringFromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };

    return imports;
}

function __wbg_init_memory(imports, memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;


    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('vidyut_prakriya_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;
