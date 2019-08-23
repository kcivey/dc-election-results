#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const csvParse = require('csv-parse');
const moment = require('moment');
const {titleize, underscored} = require('underscore.string');
const argv = require('yargs')
    .options({
        year: {
            type: 'number',
            describe: 'election year',
            requiresArg: true,
        },
        create: {
            type: 'boolean',
            describe: 'rec-create tables',
        },
    })
    .strict(true)
    .argv;
const db = require('./lib/db');
const downloadDir = __dirname + '/raw';

main().catch(console.trace)
    .finally(() => db.close());

async function main() {
    if (argv.create) {
        await db.createTables();
    }
    else {
        await db.deleteResultRecords(argv.year);
    }
    const re = new RegExp((argv.year ? argv.year + '.*' : '') + '.csv$', 'i');
    const csvFiles = fs.readdirSync(downloadDir)
        .filter(fn => re.test(fn))
        .filter(fn => !/2010/.test(fn)) // skip 2010 for now
        .map(fn => downloadDir + '/' + fn);
    for (const csvFile of csvFiles) {
        await loadCsvFile(csvFile);
    }
}

async function loadCsvFile(csvFile) {

    const records = await readCsvFile(csvFile);
    await db.insertResultRecords(records);
}

function readCsvFile(csvFile) {
    console.warn(csvFile);
    return new Promise(function (resolve, reject) {
        const records = [];
        const parser = csvParse({columns: true});
        const input = fs.createReadStream(csvFile);
        parser.on('readable', async function () {
            let record;
            while ((record = parser.read())) {
                records.push(transformRecord(record));
            }
        });
        parser.on('error', reject);
        parser.on('end', () => resolve(records));
        input.pipe(parser);
    });
}

function transformRecord(record) {
    const newRecord = {};
    const keyMap = {
        contest_number: 'contest_id',
        ward_number: 'ward',
        precinct_number: 'precinct',
    };
    for (const [key, value] of Object.entries(record)) {
        let newKey = underscored(key);
        newKey = keyMap[newKey] || newKey;
        let newValue = value;
        switch (newKey) {
            case 'election_date':
                assert(/^\d\d?\/\d\d?\/\d{4}/.test(newValue), `Unexpected date format "${value}"`);
                newValue = moment(newValue, 'MM/DD/YYYY').format();
                break;
            case 'election_name':
            case 'candidate':
                newValue = newValue.trim().replace(/\s/g, ' ');
                break;
            case 'contest_name':
                newValue = standardizeContestName(newValue);
                break;
            case 'contest_id':
            case 'precinct':
            case 'ward':
            case 'votes':
                assert(/^-?\d+$/.test(newValue), `Unexpected ${key} format "${value}"`);
                newValue = +newValue;
                break;
            case 'party':
                break;
            default:
                throw new Error(`Unexpected column "${key}"`);
        }
        newRecord[newKey] = newValue;
    }
    return newRecord;
}

function standardizeContestName(name) {
    const numbers = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];
    return titleCase(name)
        .replace(/\s+/g, ' ')
        .replace(/Advisory Neighborhood Commission(?:er)?/, 'ANC')
        .replace(/ Single Member District.*/, '')
        .replace('ANC -', 'ANC')
        .replace(/(?: (?:of|for|From)(?: the)?)? Distr.*/, '')
        .replace(/U\.s\.|United States/, 'US')
        .replace('At - Large', 'At-Large')
        .replace(/(?<=Ward )(\w+)/, m => numbers.indexOf(m) + 1)
        .trim();
}

function titleCase(s) {
    return titleize(s)
        .replace(/\b(?:Anc|Dc|\d[a-g][01]\d|IV]i*|Iv)\b/g, m => m.toUpperCase())
        .replace(/ (?:Of|The|For|And|To)(?= )/g, m => m.toLowerCase());
}
