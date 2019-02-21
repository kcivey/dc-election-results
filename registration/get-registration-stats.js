#!/usr/bin/env node

const request = require('request-promise-native');
const cheerio = require('cheerio');
const moment = require('moment');
const cacheDir = __dirname + '/cache';
const listUrl = 'https://www.dcboe.org/Data-Resources/Voter-Registration-Statistics';

request(listUrl).then(
    function (html) {
        const $ = cheerio.load(html);
        $('#hierarchical_accordion').find('li > a').each(
            function (i, link) {
                const url = $(link).attr('href');
                const text = $(link).text();
                const m = text.match(/Monthly report for the period ending (.+)/i);
                if (m) {
                    const date = moment(m[1], 'MMMM D, YYYY').format('YYYY-MM-DD');
                    console.log(date, url);
                }
                else {
                    throw new Error(`Unexpected format "${text}"`);
                }
            }
        );
    }
);
