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
                newValue = moment(newValue, 'MM/DD/YYYY').format('YYYY-MM-DD');
                break;
            case 'election_name':
                newValue = newValue.replace(/^D\.?C\.? /, '')
                    .replace('Generation Election', 'General Election');
                // fall through
            case 'candidate':
                newValue = titleCase(newValue.trim().replace(/\s/g, ' '));
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
                newValue = newValue.trim();
                break;
            default:
                throw new Error(`Unexpected column "${key}"`);
        }
        newRecord[newKey] = newValue;
    }
    if (newRecord.contest_name === 'Council') {
        newRecord.contest_name += ' Ward ' + newRecord.ward;
    }
    if (newRecord.party === 'GRN' && newRecord.election_date >= '2000-01-01') {
        newRecord.party = 'STG';
    }
    else if (newRecord.party === 'CITYWIDE') {
        newRecord.party = '';
    }
    else if (newRecord.party === 'NPN') {
        newRecord.party = 'NOP';
    }
    newRecord.code = newRecord.election_date.replace(/-/g, '') + newRecord.election_name.substr(0, 1);
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
        .replace(/(?<=Ward )(\w+)/, m => (numbers.indexOf(m) + 1) || m)
        .replace(/(^| )(?:of )?(?:the )?State Board(?: of Ed\w*)?/, '$1SBOE')
        .replace('Member SBOE', 'SBOE')
        .replace('Member of the ', '')
        .replace(/(?:to the )?(?:US )?(?=House)/, '')
        .replace(/.*President.*/, 'President')
        .replace('Measure No. ', '#')
        .replace(/Member State /, '')
        .replace(/(Ballots Cast|Registered Voters) - .*/, '$1 - Total')
        .replace(/(Total) (Ballots Cast|Registered Voters)/, '$2 - $1')
        .trim()
        .replace(/of the Council$/, 'Council')
        .replace(/^(Ward \d|At-Large|Chair(?:man))? (Council|SBOE)$/, '$2 $1');
}

function titleCase(s) {
    return titleize(s)
        .replace(/\b(?:Anc|Dc|\d[a-g][01]\d|[IV]i*|Iv)\b/g, m => m.toUpperCase())
        .replace(/ (?:Of|The|For|And|To)(?= )/g, m => m.toLowerCase());
}
