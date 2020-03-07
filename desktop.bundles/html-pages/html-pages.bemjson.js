const fs = require('fs');
const pages = [];

fs.readdirSync('desktop.bundles').map(item => {
    if(item.match(/^\.|html-pages|merged/gi)) return false;

    const {title} = require(`../${item}/${item}.bemjson.js`);
    const isProd = process.env.YENV === 'production';
    const href = isProd ? `${item}.html` : `/desktop.bundles/${item}/${item}.html`;

    pages.push({
        page: item,
        title,
        href
    });
});

module.exports = {
    block: 'page',
    title: 'Список страниц',
    favicon: '../../assets/img/favicon.ico',
    head: [
        { elem: 'meta', attrs: { name: 'description', content: '' } },
        { elem: 'meta', attrs: { name: 'viewport', content: 'width=device-width, initial-scale=1' } },
        { elem: 'css', url: 'html-pages.min.css' }
    ],
    scripts: [{ elem: 'js', url: 'html-pages.min.js' }],
    content: [
        {
            block: 'html-pages',
            content: pages.map(({page, title, href}) => {
                return {
                    elem: 'item',
                    content: [
                        {
                            tag: 'a',
                            elem: 'link',
                            attrs: { href, target: '_blank'},
                            content: [
                                {
                                    tag: 'span',
                                    elem: 'title',
                                    content: title
                                },
                                {
                                    tag: 'span',
                                    elem: 'underline'
                                },
                                {
                                    tag: 'span',
                                    elem: 'page',
                                    content: `${page}.html`
                                }
                            ]
                        }
                    ]
                }
            })
        }
    ]
};
