const crypto = require('crypto');
const fs = require('fs');
const path = require('node:path');

const etagPath = path.resolve(__dirname, '../src/etag.js');
const uuid = crypto.randomUUID();
const etagFileContent = `\
// DO NOT TOUCH THIS FILE
export default "${uuid}";
`;

new Promise((__, reject) => fs.writeFile(etagPath, etagFileContent, _ => _ && reject(_)));
