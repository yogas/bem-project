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

const findElem = (path) => {
    const data = getBemHtml(path).toString();
    const match = [...data.matchAll(/elem: '(.*?)'/ig)];
    const obj = {};
    const str = [];
    const depsPath = path.replace(/bemhtml/g,'deps');

    match.forEach( ([str, elem]) => {
        obj[elem] = `        {elem: '${elem}'}`;
    })

    for(let key in obj) {
        str.push(obj[key]);
    }

    console.log("\n");
    console.log(depsPath);
    console.log(str.join(",\n"));

    createFile(depsPath, `({
    shouldDeps: [
${str.join(",\n")}
    ]
})`, true);
}

findElem(path);
