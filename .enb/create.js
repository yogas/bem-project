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
)
// node .enb/elem.js "${path}/${block}.bemhtml.js"
`);

createFile(`${path}/${block}.deps.js`, `({
    shouldDeps: [
        {}
    ]
})
// node .enb/block.js "${path}/${block}.deps.js"
`)

createFile(`${path}/${block}.styl`, `.${block}
    //`);
