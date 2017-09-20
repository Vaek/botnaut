'use strict';

const fs = require('fs');
const path = require('path');
const po2json = require('po2json');
const Router = require('./Router');

/**
 * Tool for translating texts
 *
 * - will be looking for `<lang>.locale.po`
 *
 * @param {Function} languageResolver
 * @param {{ sourcePath: string }} [options]
 * @returns {function(*, *)}
 * @example
 * const { translate } = require('botnaut');
 *
 * bot.use(translate((req, res) => 'cs', { sourcePath: __dirname }));
 *
 * bot.use((req, res) => {
 *    res.text(res.t('Translated text'));
 * });
 */
module.exports = (languageResolver, options) => {

    const completedOptions = Object.assign({
        sourcePath: path.join(process.cwd(), 'locales')
    }, options);

    const promisedTranslators = {};
    const getTranslator = (lang) => {

        if (lang === null) {
            return Promise.resolve(w => w);
        }

        if (!promisedTranslators[lang]) {
            promisedTranslators[lang] = new Promise(
                (resolve, reject) => {
                    const filePath = path.join(completedOptions.sourcePath, `${lang}.locale.po`);
                    fs.readFile(filePath, 'utf8', (err, data) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(data);
                    });
                })
                .then((content) => {
                    const messages = po2json.parse(content, { format: 'mf' });
                    // return translator for the locale
                    return key => (typeof messages[key] !== 'undefined' ? messages[key] : key);
                });
        }
        return promisedTranslators[lang];
    };

    return (req, res) => {
        const lang = languageResolver(req);
        return getTranslator(lang).then((translator) => {
            Object.assign(res, {
                t: translator,
                tq: translator
            });
            return Router.CONTINUE;
        });
    };
};
