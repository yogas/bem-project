module.exports = {
    block: 'page',
    title: 'Main page',
    favicon: '../../../assets/img/favicon.ico',
    head: [
        { elem: 'meta', attrs: { name: 'description', content: '' } },
        { elem: 'meta', attrs: { name: 'viewport', content: 'width=device-width, initial-scale=1' } },
        { elem: 'css', url: 'index.min.css' }
    ],
    scripts: [{ elem: 'js', url: 'index.min.js' }],
    content: [
        {
            block: 'hello-world',
            content: [
                {
                    elem: 'text',
                    content: 'Hello World!'
                }

            ]
        }
    ]
};
