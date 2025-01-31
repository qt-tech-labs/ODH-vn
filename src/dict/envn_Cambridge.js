/* global api */
class envn_Cambridge {
    constructor(options) {
        this.options = options;
        this.maxexample = 2;
        this.word = "";
    }

    async displayName() {
        return "EN-VN Dictionary";
    }

    setOptions(options) {
        this.options = options;
        this.maxexample = options.maxexample;
    }

    async findTerm(word) {
        this.word = word;
        let promises = [this.findCambridge(word)];
        let results = await Promise.all(promises);
        return [].concat(...results).filter((x) => x);
    }

    isEmptyArray(arr) {
        return Array.isArray(arr) && arr.length === 0;
    }

    getTrimInnerText(node) {
        if (!node) return "";
        else return node.innerText.trim();
    }

    getPronunciation(nodes) {
        if (this.isEmptyArray(nodes)) return "";

        let pronunciation = "";

        //         const ukPronunciationDOM = nodes.querySelector(
        //             ".uk.dpron-i > .pron.dpron > .ipa"
        //         );
        //         const ukPronunciation = this.getTrimInnerText(ukPronunciationDOM);
        //         if (ukPronunciation) pronunciation += `UK[${ukPronunciation}]; `;

        const usPronunciationDOM = nodes.querySelector(
            ".us.dpron-i > .pron.dpron > .ipa"
        );
        const usPronunciation = this.getTrimInnerText(usPronunciationDOM);
        if (usPronunciation) pronunciation += `US[${usPronunciation}]; `;

        return pronunciation.trim();
    }

    getPosgram(node) {
        if (!node) return "";

        const posgram = this.getTrimInnerText(node);
        if (!posgram) return "";

        return `<span class='pos'>${posgram.trim()}</span>`;
    }

    getAudio(node) {
        if (!node) return "";

        return "https://dictionary.cambridge.org" + node.getAttribute("src");
    }

    getExamples(expression, node) {
        const examples = node.querySelectorAll(".def-body .examp");
        if (this.isEmptyArray(examples)) return "";
        if (this.maxexample <= 0) return "";

        let definition = "";
        definition += '<ul class="sents">';
        for (const [index, example] of examples.entries()) {
            if (index > this.maxexample - 1) break;
            let engExample = this.getTrimInnerText(example.querySelector(".eg"));
            definition += `<li class='sent'><span class='eng_sent'>${engExample.replace(
                RegExp(expression, "gi"),
                `<b>${expression}</b>`
            )}</span>`;
        }
        definition += "</ul>";

        return definition;
    }


    async findVNSoha(word) {
        let notes = [];
        if (!word) return [];

        let base = "http://tratu.soha.vn/dict/en_vn/";
        let url = base + encodeURIComponent(word);
        let doc = "";
        try {
            let data = await api.fetch(url);
            let parser = new DOMParser();
            doc = parser.parseFromString(data, "text/html");
        } catch (err) {
            return [];
        }

        const entries = doc.querySelectorAll(".section-h3");
        if (this.isEmptyArray(entries)) return [];

        for (const entry of entries) {
            const definitions = [];

            const pos = this.getPosgram(entry.querySelector(".mw-headline"))

            const sensblocks = entry.querySelectorAll('.section-h5');
            if (this.isEmptyArray(sensblocks)) continue;

            for (const sensblock of sensblocks) {
                let vnTrans = this.getTrimInnerText(
                    sensblock.childNodes[0].innerText
                );
                if (!vnTrans) continue;
                // const tran = `<span class='tran'>${vnTrans}</span>`;
                let fullTrans = `<span class="pos">${pos}</span>`
                fullTrans += `<span class="tran"><span class="eng_tran">${vnTrans}</span></span><br/>`;
                // let definition = `${pos} : ${tran}`;

                if (fullTrans) definitions.push(fullTrans);
            }
            notes.push({
                definitions
            });
        }
        return notes;
    }



    async findVNCambridge(word) {
        let notes = [];
        if (!word) return [];

        let base = "https://dictionary.cambridge.org/search/english-vietnamese/direct/?q=";
        let url = base + encodeURIComponent(word);
        let doc = "";
        try {
            let data = await api.fetch(url);
            let parser = new DOMParser();
            doc = parser.parseFromString(data, "text/html");
        } catch (err) {
            return [];
        }

        const entries = doc.querySelectorAll(".english-vietnamese .kdic");
        if (this.isEmptyArray(entries)) return [];

        for (const entry of entries) {
            const definitions = [];

            const pos = this.getPosgram(entry.querySelector(".dpos"))

            const sensblocks = entry.querySelectorAll(".sense-block");
            if (this.isEmptyArray(sensblocks)) continue;

            for (const sensblock of sensblocks) {
                let vnTrans = this.getTrimInnerText(
                    sensblock.querySelector(".trans")
                );
                if (!vnTrans) continue;
                // const tran = `<span class='tran'>${vnTrans}</span>`;
                let fullTrans = `<span class="pos">${pos}</span>`
                fullTrans += `<span class="tran"><span class="eng_tran">${vnTrans}</span></span><br/>`;
                // let definition = `${pos} : ${tran}`;

                if (fullTrans) definitions.push(fullTrans);
            }
            notes.push({
                definitions
            });
        }
        return notes;
    }


    async findCambridge(word) {
        let notes = [];
        if (!word) return [];

        let base = "https://dictionary.cambridge.org/search/english/direct/?q=";
        let url = base + encodeURIComponent(word);
        let doc = "";
        try {
            let data = await api.fetch(url);
            let parser = new DOMParser();
            doc = parser.parseFromString(data, "text/html");
        } catch (err) {
            return [];
        }

        const entries = doc.querySelectorAll(".pr .entry-body__el");
        if (this.isEmptyArray(entries)) return [];

        for (const entry of entries) {
            const definitions = [];
            const audios = [];

            const expression = this.getTrimInnerText(
                entry.querySelector(".headword")
            );

            const reading = this.getPronunciation(entry);

            const pos = this.getPosgram(entry.querySelector(".posgram"));

            audios.push(this.getAudio(entry.querySelector(".uk.dpron-i source")));
            audios.push(this.getAudio(entry.querySelector(".us.dpron-i source")));

            const sensbodys = entry.querySelectorAll(".sense-body");
            if (this.isEmptyArray(sensbodys)) continue;

            for (const sensbody of sensbodys) {
                const sensblocks = sensbody.childNodes;
                if (this.isEmptyArray(sensblocks)) continue;

                for (const sensblock of sensblocks) {
                    let phrasehead = "";
                    let defblocks = [];
                    if (
                        sensblock.classList &&
                        sensblock.classList.contains("phrase-block")
                    ) {
                        phrasehead = this.getTrimInnerText(
                            sensblock.querySelector(".phrase-title")
                        );
                        phrasehead = phrasehead
                            ? `<div class="phrasehead">${phrasehead}</div>`
                            : "";
                        defblocks = sensblock.querySelectorAll(".def-block") || [];
                    }
                    if (
                        sensblock.classList &&
                        sensblock.classList.contains("def-block")
                    ) {
                        defblocks = [sensblock];
                    }
                    if (defblocks.length <= 0) continue;

                    // make definition segment
                    for (const defblock of defblocks) {
                        let engTran = this.getTrimInnerText(
                            defblock.querySelector(".ddef_h .def")
                        );
                        if (!engTran) continue;

                        let definition = "";
                        engTran = `<span class='eng_tran'>${engTran.replace(
                            RegExp(expression, "gi"),
                            `<b>${expression}</b>`
                        )}</span>`;
                        const tran = `<span class='tran'>${engTran}</span>`;
                        definition += phrasehead ? `${phrasehead}${tran}` : `${pos}${tran}`;

                        definition += this.getExamples(expression, defblock);

                        if (definition) definitions.push(definition);
                    }
                }
            }

            const css = this.renderCSS();
            notes.push({
                css,
                expression,
                reading,
                definitions,
                audios,
            });
        }

        // add VIetname

        let vntrans = await this.findVNCambridge(word)

        if (vntrans && vntrans.length > 0) {
            let first = vntrans[0]
            if (first && first.definitions && first.definitions.length > 0) {
                let str = first.definitions.join("")
                str && notes && notes.length > 0 && notes[0].definitions[0] && (notes[0].definitions[0] = str + notes[0].definitions[0])
            }
        }
        // Add Vientma

        return notes;
    }

    renderCSS() {
        return `
              <style>
                  div.phrasehead{margin: 2px 0;font-weight: bold;}
                  span.star {color: #FFBB00;}
                  span.pos  {text-transform:lowercase; font-size:0.9em; margin-right:5px; padding:2px 4px; color:white; background-color:#0d47a1; border-radius:3px;}
                  span.tran {margin:0; padding:0;}
                  span.eng_tran {margin-right:3px; padding:0;}
                  ul.sents {font-size:0.8em; list-style:square inside; margin:3px 0;padding:5px;background:rgba(13,71,161,0.1); border-radius:5px;}
                  li.sent  {margin:0; padding:0;}
                  span.eng_sent {margin-right:5px;}
              </style>`;
    }
}
