const fs = require('fs');
const [nodePath, appPath, page] = process.argv;

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

const path = `desktop.bundles/${page}`;

createDir(path);
createFile(`${path}/${page}.bemjson.js`, `module.exports = {
    block: 'page',
    title: '${page}',
    favicon: '../../../assets/img/favicon.ico',
    head: [
        { elem: 'meta', attrs: { name: 'description', content: '' } },
        { elem: 'meta', attrs: { name: 'viewport', content: 'width=device-width, initial-scale=1' } },
        { elem: 'css', url: '${page}.min.css' },
    ],
    scripts: [
        { elem: 'js', url: '${page}.min.js' },
    ],
    content: [

    ]
};
`);

