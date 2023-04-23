"use strict";

import DeferPromise from './DeferPromise.js';
import json_schema_to_latex from './json_schema_to_latex.js';

export default class MainRunner {
    constructor(viewPDF, latexFileUrl) {
        this.viewPDF = viewPDF;
        this.latexFileUrl = latexFileUrl;
    }

    isLocalHost = /localhost|[0-9]{1,4}\.[0-9]{1,4}\.[0-9]{1,4}\.[0-9]{1,4}|::1|\.local|^$/gi.test(window.location.hostname);
    noCache = (new URL(document.location)).searchParams.has("no_cache");

    onError(error) {
        document.getElementById('loading_icon').style.display = 'none';
        document.getElementById('outerContainer').style.display = 'none';
        document.getElementById('error_message').style.display = 'flex';

        console.error(error);
    };

    writePdfToViewer(url) {
        document.getElementById('loading_icon').style.display = 'none';
        document.getElementById('error_message').style.display = 'none';
        document.getElementById('outerContainer').style.display = 'block';

        this.viewPDF(url);
    }

    async transpileJsToLatex(latex_file) {
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

    get memoizedPdfUrl() {
        if (this._memoizedPdfUrl !== undefined) {
            return this._memoizedPdfUrl;
        }
        // No caching for local development
        if (this.isLocalHost || this.noCache) {
            return this._memoizedPdfUrl = null;
        }
        const pdfUrlFromLocal = localStorage.getItem("__hkleungai__pdf_url");
        if (pdfUrlFromLocal) {
            return this._memoizedPdfUrl = pdfUrlFromLocal;
        }
        return this._memoizedPdfUrl = null;
    }

    TOTAL_MEMORY = 80 * 1024 * 1024;

    async defer_run() {
        const defer = new DeferPromise();

        if (this.memoizedPdfUrl) {
            writePdfToViewer(this.memoizedPdfUrl);
            defer.resolve();
            return defer.promise;
        }

        const transpiledLatexContent = await this.transpileJsToLatex(this.latexFileUrl);
        if (transpiledLatexContent instanceof Error) {
            defer.reject(transpiledLatexContent);
            return defer.promise;
        }

        const pdftex = new PDFTeX();
        pdftex.set_TOTAL_MEMORY(this.TOTAL_MEMORY).then(() => {    
            pdftex.compile(transpiledLatexContent).then((pdf_dataurl) => {
                if (!pdf_dataurl) {
                    defer.reject("Unknown PDFTeX error occurs");
                    return;
                }
                if (!this.isLocalHost) {
                    localStorage.setItem("__hkleungai__pdf_url", pdf_dataurl);
                }
                this.writePdfToViewer(pdf_dataurl);
            });
        });

        return defer.promise;
    }

    async run() {
        this.defer_run().catch(this.onError);
    }
}