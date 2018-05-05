/**
* @param context {WebtaskContext}
*/
'use strict';

const https = require('https');
const cache = require('memory-cache');
const TWENTY_FOUR_HOURS = 3600000;

function alfredOutPut(result, alfred) {
    if (!alfred) {
      return result.join('\n');
    }
    const items = result.filter(Boolean).map(singleEntry => {
        const title = singleEntry.match(/- \[.+\]/g) || [''];
        const link = singleEntry.match(/\]\(.+\)/g) || [''];
        const absoluteLink = link[0].replace(/(-\s\[)|(\])/g, '').replace(/\(|\)/g, '');
        return {
            title: title[0].replace(/(-\s\[)|(\])/g, ''),
            subtitle: absoluteLink,
            arg: absoluteLink
        };
    }) || [];
    return {
          items
    };
}

function processResult(markdown, input, alfred) {
    const arrayOfResults = markdown.split('\n');
    if (!input) {
        return alfredOutPut(arrayOfResults, alfred);
    } else {
        const foundResult = arrayOfResults.filter(singleEntry => singleEntry.toLowerCase().includes(input.toLowerCase()));
        return alfredOutPut(foundResult, alfred);

    }
}

module.exports = function(context, cb) {
    const input = context.query.query;
    const cachedResult = cache.get(input);
    if (cachedResult) {
      return cb(null, processResult(cachedResult, input, context.query.alfred));;
    }
    https
      .get(
          'https://raw.githubusercontent.com/DKunin/today-i-liked/master/README.md',
          result => {
              let str = '';
              result.on('data', chunk => {
                  str += chunk;
              });
              result.on('end', () => {
                   cache.put(input, str, TWENTY_FOUR_HOURS);
                   cb(null, processResult(str, input, context.query.alfred));
              });
          }
      )
      .on('error', e => {
          console.error(e);
      });
 
};