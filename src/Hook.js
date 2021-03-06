/*
 * @author David Menger
 */
'use strict';

class Hook {

    constructor (processor) {
        this.processor = processor;
    }

    onRequest (body = {}) {
        if (body.object !== 'page') {
            return Promise.resolve(null);
        }
        const wait = [];

        body.entry.forEach((event) => {
            const pageId = event.id;
            if (Array.isArray(event.messaging)) {
                event.messaging.forEach((data) => {
                    const then = this.processor.processMessage(data, pageId);
                    wait.push(then);
                });
            }
        });

        return Promise.all(wait);
    }

}

module.exports = Hook;
