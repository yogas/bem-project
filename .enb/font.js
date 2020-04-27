const fs = require('fs');
const path = require('path');

const dir = 'common.blocks/font';

const isDir = function(path) {
    return fs.lstatSync(path).isDirectory();
}

const createFile = (name, content='') => {
    if (!fs.existsSync(name)) {
        fs.writeFileSync(name, content);
    }
}

fs.readdirSync(dir).map(font => {
    const fontPath = `${dir}/${font}`;

    if(isDir(fontPath)) {
        fs.readdirSync(fontPath).map(type => {
            const typePath = `${fontPath}/${type}`;
            const fileName = `${font}${type}`.replace('__','');
            const stylFile = `${typePath}/font__${fileName}.styl`;

            fs.readdirSync(typePath).map(file => {

                const ext = path.extname(file);
                const filePath = `${typePath}/${fileName}${ext}`;
                const realPath = `${typePath}/${file}`;

                if (!fs.existsSync(filePath)) {
                    if(ext !== '.styl') {
                        fs.rename(realPath, filePath, () => {
                            console.log(file, `${fileName}${ext}`);
                        });
                    }
                }
            });

            createFile(stylFile, `font-face('${font}/${type}');`)
        });
    }
});
