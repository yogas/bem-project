const fs = require('fs');
const [nodePath, appPath, block] = process.argv;

const createDir = (name) => {
    if (!fs.existsSync(name)) {
        fs.mkdirSync(name);
    }
}

const createFile = (name, content='') => {
    if (!fs.existsSync(name)) {
        fs.writeFileSync(name, content);
    }
}

const path = `desktop.blocks/${block}`;

createDir(path);
createFile(`${path}/${block}.bemhtml.js`, `block('${block}')(
    content()(function () {
        const mix = { block: '${block}' };
        return [];
    })
)`);

createFile(`${path}/${block}.deps.js`, `({
    shouldDeps: [
        {}
    ]
})`)

createFile(`${path}/${block}.styl`, `.${block}
    //`);
