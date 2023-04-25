"use strict";

import DeferPromise from './DeferPromise.js';
import etag from './etag.js';
import json_schema_to_latex from './json_schema_to_latex.js';

export default class MainRunner {
    #viewPDF;
    #latexFileUrl;
    constructor(viewPDF, latexFileUrl) {
        this.#viewPDF = viewPDF;
        this.#latexFileUrl = latexFileUrl;
    }

    async run() {
        this.#defer_run().catch(this.#onError);
    }

    async #defer_run() {
        const defer = new DeferPromise();

        if (this.#pdfUrl) {
            this.#writePdfToViewer(this.#pdfUrl);
            defer.resolve();
            return defer.promise;
        }

        // this.#local_etag = etag;

        const transpiledLatexContent = await this.#transpileJsToLatex(this.#latexFileUrl);
        if (transpiledLatexContent instanceof Error) {
            defer.reject(transpiledLatexContent);
            return defer.promise;
        }

        const pdftex = new PDFTeX();
        pdftex.set_TOTAL_MEMORY(this.#TOTAL_MEMORY).then(() => {
            pdftex.compile(transpiledLatexContent).then((pdf_dataurl) => {
                if (!pdf_dataurl) {
                    defer.reject("Unknown PDFTeX error occurs");
                    return;
                }
                this.#local_pdfUrl = pdf_dataurl;
                this.#writePdfToViewer(pdf_dataurl);
            });
        });

        return defer.promise;
    }
    
    #onError(error) {
        document.getElementById('loading_icon').style.display = 'none';
        document.getElementById('outerContainer').style.display = 'none';
        document.getElementById('error_message').style.display = 'flex';

        console.error(error);
    };

    #writePdfToViewer(url) {
        document.getElementById('loading_icon').style.display = 'none';
        document.getElementById('error_message').style.display = 'none';
        document.getElementById('outerContainer').style.display = 'block';

        this.#viewPDF(url);
    }

    async #transpileJsToLatex(latex_file) {
        try {
            const raw_latex_src = (await (await fetch(latex_file)).text()).replace(/^%.+/gm, '');
            const inner_scripts = [...raw_latex_src.matchAll(/\$\$\{[\s\S]*?\}\$\$/gm)];
            const inner_evals = await Promise.all(inner_scripts.map(async (inner_script) => {
                const defer = new DeferPromise();
                defer.resolve(await eval(inner_script[0].replace(/\$\$\{([\s\S]*?)\}\$\$/m, '$1')));
                return defer.promise;
            }))
            let i = 0;
            return raw_latex_src.replace(/\$\$\{[\s\S]*?\}\$\$/gm, s => inner_evals[i++]);
        }
        catch (e) {
            return e;
        }
    }

    get #local_etag_key() {
        return '__hkleungai__etag';
    }
    set #local_etag(_etag) {
        localStorage.setItem(this.#local_etag_key, _etag);
    }
    get #local_etag() {
        return localStorage.getItem(this.#local_etag_key);
    }

    get #local_pdfUrl_key() {
        return '__hkleungai__pdf_url';
    }
    set #local_pdfUrl(_local_pdfUrl) {
        localStorage.setItem(this.#local_pdfUrl_key, _local_pdfUrl);
    }
    get #local_pdfUrl() {
        return localStorage.getItem(this.#local_pdfUrl_key);
    }

    get #isLocalHost() {
        return /localhost|[0-9]{1,4}\.[0-9]{1,4}\.[0-9]{1,4}\.[0-9]{1,4}|::1|\.local|^$/gi.test(window.location.hostname);
    }

    get #pdfUrl() {
        const is_etag_verified = this.#local_etag === etag;
        this.#local_etag = etag;
        return (!this.#isLocalHost && is_etag_verified) ? this.#local_pdfUrl : '';
    }

    #TOTAL_MEMORY = 80 * 1024 * 1024;
}
