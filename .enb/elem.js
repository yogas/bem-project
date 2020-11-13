const fs = require('fs');
const [nodePath, appPath, path] = process.argv;

const getBemHtml = (path) => {
    const data = fs.readFileSync(path, 'utf-8');
    return data;
}

const createFile = (name, content='', force=false) => {
    if (!fs.existsSync(name) || force) {
        fs.writeFileSync(name, content);
    }
}

const findProp = (p, data) => {
    const reg = new RegExp(`${p}: '(.*?)'`, 'ig');
    const match = [...data.matchAll(reg)];

    const obj = {};
    const str = [];
    const depsPath = path.replace(/bemhtml/g,'deps');
    const currentBlock = getBlock(path);

    match.forEach( ([str, elem]) => {
        obj[elem] = `        {${p}: '${elem}'}`;
    })

    for(let key in obj) {
        if(obj[key] === `        {block: '${currentBlock}'}`) continue;
        str.push(obj[key]);
    }

    return str;
}

const getBlock = (path) => {
    const [a,b,c] = path.split("/");
    return b;
};

const findElem = (path) => {
    const data = getBemHtml(path).toString();
    const match = [...data.matchAll(/elem: '(.*?)'/ig)];
    const elem = findProp('elem', data);
    const block = findProp('block', data);

    // const obj = {};
    // const str = [];
    const depsPath = path.replace(/bemhtml/g,'deps');
    //
    // match.forEach( ([str, elem]) => {
    //     obj[elem] = `        {elem: '${elem}'}`;
    // })
    //
    // for(let key in obj) {
    //     str.push(obj[key]);
    // }

    console.log("\n");
    console.log(depsPath);
    console.log(block.join(",\n"));
    console.log(elem.join(",\n"));
    console.log("\n");
    console.log(`node .enb/block.js "${path.replace('bemhtml.js','deps.js')}"`);

    createFile(depsPath, `({
    shouldDeps: [
${block.join(",\n")}${block.length?",":""}
${elem.join(",\n")}
    ]
})
// node .enb/block.js "${path.replace('bemhtml.js','deps.js')}"
`, true);
}



findElem(path);
