/* global api */
class envn_Cambridge {
    constructor(options) {
        this.options = options;
        this.maxexample = 2;
        this.word = '';
    }

    async displayName() {
        return 'Cambridge EN->VN Dictionary';
    }

    setOptions(options) {
        this.options = options;
        this.maxexample = options.maxexample;
    }

    async findTerm(word) {
        this.word = word;
        return await this.findCambridge(word);
    }

    removeTags(elem, name) {
        let tags = elem.querySelectorAll(name);
        tags.forEach(x => {
            x.outerHTML = '';
        });
    }

    removelinks(elem) {
        let tags = elem.querySelectorAll('a');
        tags.forEach(x => {
            x.outerHTML = x.innerText;
        });

        tags = elem.querySelectorAll('h2');
        tags.forEach(x => {
            x.outerHTML = `<div class='head2'>${x.innerHTML}</div>`;
        });

        tags = elem.querySelectorAll('h3');
        tags.forEach(x => {
            x.outerHTML = `<div class='head3'>${x.innerHTML}</div>`;
        });
    }

    async findCambridge(word) {
        if (!word) return null;

        let base = 'https://dictionary.cambridge.org/search/english-vietnamese/direct/?q=';
        let url = base + encodeURIComponent(word);
        let doc = '';
        try {
            let data = await api.fetch(url);
            let parser = new DOMParser();
            doc = parser.parseFromString(data, 'text/html');
        } catch (err) {
            return null;
        }

        let contents = doc.querySelectorAll('.pr .dictionary') || [];
        if (contents.length == 0) return null;

        let definition = '';
        for (const content of contents) {
            this.removeTags(content, '.extraexamps');
            this.removeTags(content, '.definition-src');
            this.removeTags(content, 'h2');
            this.removeTags(content, '.d_br');
            this.removeTags(content, '.freq.dfreq');
            this.removelinks(content);
            definition += content.innerHTML;
        }
        let css = this.renderCSS();
        return definition ? css + definition : null;
    }

    renderCSS() {
        let css = `
            <style>
                span.star {color: #FFBB00;}
                span.cet  {margin: 0 3px;padding: 0 3px;font-weight: normal;font-size: 0.8em;color: white;background-color: #5cb85c;border-radius: 3px;}
                span.pos  {text-transform:lowercase; font-size:0.9em; margin-right:5px; padding:2px 4px; color:white; background-color:#0d47a1; border-radius:3px;}
                span.tran {margin:0; padding:0;}
                span.eng_tran {margin-right:3px; padding:0;}
                span.chn_tran {color:#0d47a1;}
                ul.sents {font-size:0.8em; list-style:square inside; margin:3px 0;padding:5px;background:rgba(13,71,161,0.1); border-radius:5px;}
                li.sent  {margin:0; padding:0;}
                span.eng_sent {margin-right:5px;}
                span.chn_sent {color:#0d47a1;}
            </style>`;
        return css;
    }
}