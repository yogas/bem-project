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

const className = 'CHtml' + block.split('-').map( item => {
    return item.substr(0,1).toUpperCase() + item.substr(1);
}).join("");

const getDate = () => {
    const date = new Date();
    const d = {
        d: date.getDate(),
        m: date.getMonth(),
        y: date.getFullYear(),
        h: date.getHours(),
        i: date.getMinutes(),
        s: date.getSeconds()
    };

    for(var key in d) {
        d[key] = parseInt(d[key]) < 10 ? `0${d[key]}` : d[key];
    }

    return `${d.d}.${d.m}.${d.y} ${d.h}:${d.i}:${d.s}`;
}

const settingPath = appPath.replace('create-script.js','.settings.js');

if (!fs.existsSync(settingPath)) {
    console.log(`Settings file .enb/.settings.js not found.`);
    console.log(`rename .enb/tpl.settings.js to .enb/.settings.js`);
    process.exit();
}

const author = require(settingPath);

createFile(`${path}/${block}.js`, `/**
 * Класс ${className}
 * Предназначен для работы блока .${block}
 *
 * @author ${author.name} <${author.email}>
 * @date ${getDate()}
 */

function ${className}(target) {
    "use strict";

    this.$com = $(target);
    this.block = "${block}";
    this.selector = "."+this.block;

    /**
     * Конструктор
     */
    this.init = function () {
        this.$com.data("com", this);
        this.initEvents();
    };

    /**
     * Инициализация событий
     */
    this.initEvents = function () {

    };

    this.init(); // Вызов конструктора
}

$(function () {
    "use strict";

    $(".${block}").each(function () {
        new ${className}(this);
    });
});`);
