# Introduction

This is a project developed on top of 
[textlive.js][textlive.js] and mozilla's [PDF.js][PDF.js], 
alongside with the idea of 
using [JSON Schema][JSON Schema] as a way of representing core data for the project.

# Demo

There should be a pre-compiled file 
in https://hkleungai.github.io/CV.latex.js/CV-as-of-{YYYY}-{MM}-{DD}.pdf,
in which the exact date can be found in the `src` folder.

# Compilation 
Simply open a local server and access `src/index.html`.
- You may freely edit `src/index.html` and / or `src/CV.tex` to change the layout and texts inside the PDF.
- You may also add another JSON schema for storing a latex layout.
  And to render it, one needs to,
    - Add / Modify logic in `src/json_schema_to_latex.js`
    - Add a js-style fetch block on `src/CV.tex`, e.g. `$${fetch('./some.data.json').then(_ => _.json()).then(json_schema_to_latex)}$$`
- Right now only a subset of latex package can be imported. 
  The PDF viewer should show you an error message if you encounter an unrecognized package.

# TODO 

- Revive textlive.js, which requires
    - Run `make` with emscipten script
    - Migrate sequential blocking file fetching to Promise.all()
    - Deploy it to npm ~~which seems nearly impossible~~
- Turn this into a nodejs project so that no manual copying from PDF.js is needed

[textlive.js]: https://github.com/manuels/texlive.js/
[PDF.js]: https://github.com/mozilla/pdf.js/
[JSON Schema]: https://json-schema.org/