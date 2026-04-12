/**
 * Fix Prisma Client default.js package import for environments
 * where `require('#main-entry-point')` may fail.
 */
const fs = require('fs');
const path = require('path');

const targetFile = path.join(
    __dirname, '..', 'node_modules', '.prisma', 'client', 'default.js'
);

if (!fs.existsSync(targetFile)) {
    console.log('[fix-prisma] default.js not found, skipping (prisma generate may not have run yet).');
    process.exit(0);
}

const content = fs.readFileSync(targetFile, 'utf8');

if (content.includes("#main-entry-point")) {
    const patched = content.replace(
        "require('#main-entry-point')",
        "require('./index.js')"
    );
    fs.writeFileSync(targetFile, patched, 'utf8');
    console.log('[fix-prisma] patched default.js: #main-entry-point -> ./index.js');
} else if (content.includes("require('./index.js')")) {
    console.log('[fix-prisma] already patched, nothing to do.');
} else {
    console.log('[fix-prisma] default.js has unexpected content, skipping patch.');
}
