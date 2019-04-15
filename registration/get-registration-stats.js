#!/usr/bin/env node

const fs = require('fs');
const util = require('util');
const URL = require('url');
const access = util.promisify(fs.access);
const writeFile = util.promisify(fs.writeFile);
const request = require('request-promise-native');
const cheerio = require('cheerio');
const moment = require('moment');
const tabula = require('tabula-js');
const _ = require('lodash');
const csvParse = require('csv-parse/lib/sync');
const db = require('./db');
const cacheDir = __dirname + '/cache';
const listUrl = 'https://www.dcboe.org/Data-Resources/Voter-Registration-Statistics';

db.createTables().then(retrieveData);

function retrieveData() {
    request(listUrl).then(
        async function (html) {
            const $ = cheerio.load(html);
            const links = $('#hierarchical_accordion').find('li > a').toArray();
            for (const link of links) {
                const url = $(link).attr('href');
                const text = $(link).text();
                const m = text.match(/Monthly report for the period ending (.+)/i);
                if (m) {
                    const date = moment(m[1], 'MMMM D, YYYY').format('YYYY-MM-DD');
                    console.log(date, url);
                    const pdfFile = await getPdfFile(date, url);
                    console.log('handling', date);
                    await processPdf(date, pdfFile);
                }
                else {
                    throw new Error(`Unexpected format "${text}"`);
                }
            }
            process.exit();
        }
    );
}

function getPdfFile(date, url) {
    const pdfFile = cacheDir + '/' + date + '.pdf';
    console.log('checking for', pdfFile);
    return access(pdfFile, fs.constants.F_OK)
        .catch(
            function (err) {
                if (err.code !== 'ENOENT') {
                    throw err;
                }
                url = URL.resolve(listUrl, url);
                console.log('getting', url);
                return request({uri: url, encoding: null})
                    .then(pdfContent => writeFile(pdfFile, pdfContent))
                    .then(pause);
            }
        )
        .then(() => pdfFile);
}

function pause(result) {
    return new Promise(resolve => setTimeout(resolve.bind(null, result), 3000));
}

function processPdf(date, pdfFile) {
    return new Promise(
        function (resolve, reject) {
            const stream = tabula(pdfFile, {guess: true, debug: true, spreadsheet: true, pages: 'all'}).streamCsv();
            let columnTitles = null;
            const precinctRecords = [];
            let ward = null;
            stream
                .split()
                .doto(function (line) {
                    if (!line) {
                        return;
                    }
                    line = line.replace(/\s+/g, ' ');
                    const data = csvParse(line)[0].map(v => /^[\d,.]+$/.test(v) ? +v.replace(',', '') : v);
                    const m = line.match(/WARD (\d) REGISTRATION SUMMARY|NEW REGISTRATIONS/);
                    if (m || data.length < 2) {
                        columnTitles = null;
                        ward = m && m[1] ? +m[1] : null;
                        return;
                    }
                    else if (!columnTitles) {
                        columnTitles = data.map(_.camelCase);
                        return;
                    }
                    const record = _.zipObject(columnTitles, data);
                    if (record.precinct && record.precinct !== 'TOTALS') {
                        record.date = date;
                        record.ward = ward;
                        delete record[''];
                        precinctRecords.push(record);
                    }
                })
                .done(function () {
                    db.insertRegistrationRecords(precinctRecords)
                        .then(function () {
                            console.log(`${precinctRecords.length} records inserted`);
                            resolve(true);
                        });
                });
        }
    );
}
