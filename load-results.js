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
            describe: 're-create tables',
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
        .map(fn => downloadDir + '/' + fn);
    for (const csvFile of csvFiles) {
        await loadCsvFile(csvFile);
    }
    await db.setWardFor2010General();
}

async function loadCsvFile(csvFile) {

    const records = await readCsvFile(csvFile);
    await db.insertResultRecords(records);
}

function readCsvFile(csvFile) {
    console.warn(csvFile);
    return new Promise(function (resolve, reject) {
        const extra = /General.*2010/.test(csvFile) ?
            {election_date: '2010-11-02', election_name: 'General Election'} : {};
        const records = [];
        const parser = csvParse({columns: true});
        const input = fs.createReadStream(csvFile);
        parser.on('readable', async function () {
            let record;
            while ((record = parser.read())) {
                records.push(transformRecord({...record, ...extra}));
            }
        });
        parser.on('error', reject);
        parser.on('end', () => resolve(records));
        input.pipe(parser);
    });
}

function transformRecord(record) {
    const newRecord = {};
    const keyMap = { // use 'SKIP' to skip
        contest_id: 'SKIP',
        contest_name: 'contest',
        contest_number: 'SKIP',
        ward_number: 'ward',
        precinct_number: 'precinct',
        pct: 'precinct',
        district: 'SKIP',
        election_type_name: 'election_name',
        primary_party: 'party',
        office: 'contest',
        ballot_name: 'candidate',
        election_precinct_name: 'SKIP',
        election_precinct_number: 'precinct',
        ballot_placement: 'SKIP',
        cand_cont_id: 'SKIP',
        candidate_order: 'SKIP',
    };
    const partyMap = {
        'Democratic': 'DEM',
        'Republican': 'REP',
        'Statehood Green': 'STG',
    };
    for (const [key, value] of Object.entries(record)) {
        let newKey = underscored(key);
        newKey = keyMap[newKey] || newKey;
        let newValue = value;
        switch (newKey) {
            case 'election_date':
                assert(/^(?:\d\d?\/\d\d?\/\d{4}|\d{4}-\d\d-\d\d)/.test(newValue), `Unexpected date format "${value}"`);
                newValue = moment(newValue, ['MM/DD/YYYY', 'YYYY-MM-DD']).format('YYYY-MM-DD');
                break;
            case 'election_name':
                newValue = newValue.replace(/^D\.?C\.? /, '')
                    .replace('Generation Election', 'General Election')
                    .replace('Mayoral Primary', 'Primary Election');
                // fall through
            case 'candidate':
                newValue = titleCase(newValue.trim().replace(/\s/g, ' '));
                break;
            case 'contest':
                newValue = standardizeContestName(newValue);
                break;
            case 'precinct':
                if (newRecord.precinct) { // 2010 has both pct (which is just the number) and precinct
                    continue;
                }
                newValue = newValue.replace(/^Precinct /i, '');
                // fall through
            case 'ward':
            case 'votes':
                assert(/^-?\d+$/.test(newValue), `Unexpected ${key} format "${value}"`);
                newValue = +newValue;
                break;
            case 'party':
                newValue = partyMap[newValue] || newValue.trim();
                break;
            case 'SKIP':
                continue;
            default:
                throw new Error(`Unexpected column "${key}"`);
        }
        newRecord[newKey] = newValue;
    }
    if (newRecord.contest === 'Council') {
        newRecord.contest += ' Ward ' + newRecord.ward;
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
    if (newRecord.contest === newRecord.candidate) { // for ballots and registered in 2010 general
        newRecord.candidate = '';
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
