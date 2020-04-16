const fs = require('fs');
const [nodePath, appPath, path] = process.argv;

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

const getDeps = (path) => {
    const data = fs.readFileSync(path, 'utf-8');
    return eval(data.replace(/^\(|\)/gi, ''));
}

const getBlockInfo = (path) => {
    const [blocksPath, block] = path.split('/');
    return {
        blockPath: `${blocksPath}/${block}/`,
        block
    }
}

const createBlocks = (path) => {
    const {blockPath, block} = getBlockInfo(path);
    const deps = getDeps(path);

    deps.forEach(({elem, mods}) => {

        if(elem !== undefined) {

            const blockName = `${block}__${elem}`;
            createDir(`${blockPath}/__${elem}`);
            createFile(`${blockPath}/__${elem}/${blockName}.styl`, `.${blockName}\n    //`);

            if (mods !== undefined) {
                for (let key in mods) {
                    createDir(`${blockPath}/__${elem}/_${key}`);

                    let modsName = `${block}__${elem}_${key}`;
                    if (typeof (mods[key]) !== 'boolean') {
                        modsName = `${modsName}_${mods[key]}`;
                    }

                    const modsPath = `${blockPath}/__${elem}/_${key}/${modsName}.styl`;
                    createFile(modsPath, `.${modsName}\n    //`);
                }
            }
        } else {

            if(mods !== undefined) {
                for (let key in mods) {
                    createDir(`${blockPath}/_${key}`);

                    let modsName = `${block}_${key}`;
                    if (typeof (mods[key]) !== 'boolean') {
                        modsName = `${modsName}_${mods[key]}`;
                    }

                    const modsPath = `${blockPath}/_${key}/${modsName}.styl`;
                    createFile(modsPath, `.${modsName}\n    //`);
                }
            }
        }
    })
}

if(path) {
    createBlocks(path);
}
