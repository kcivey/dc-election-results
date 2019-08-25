#!/usr/bin/env node

const fs = require('fs');
const argv = require('yargs')
    .options({
        'anc': {
            type: 'boolean',
            describe: 'include advisory neighborhood commissioners (use --no-anc to omit)',
        },
        'election': {
            type: 'string',
            describe: 'election code (eg, 20181106G) or "all"; defaults to most recent',
            requiresArg: true,
        },
        'party': {
            type: 'string',
            describe: 'party (only for primaries',
            requiresArg: true,
        },
        'pretty': {
            type: 'boolean',
            describe: 'pretty-print the JSON',
        },
        'sboe': {
            type: 'boolean',
            describe: 'include State Board of Education (use --no-sboe to omit)',
        },
        'ward-map': {
            type: 'boolean',
            describe: 'make JSON only for ward map',
        },
    })
    .strict(true)
    .argv;
const db = require('./lib/db');

main().catch(console.trace)
    .finally(() => db.close());

async function main() {
    let electionCode = argv.election;
    let party = argv.party;
    if (!electionCode) {
        electionCode = await db.getMostRecentElectionCode();
    }
    if (!/P$/i.test(electionCode) && party) {
        console.warn('Ignoring party since election is not a primary');
        party = null;
    }
    const electionCodes = electionCode === 'all' ? await db.getElectionCodes() : [electionCode];
    for (const electionCode of electionCodes) {
        console.warn('Getting', electionCode);
        const rows = await db.getResults(electionCode, {party, anc: argv.anc, sboe: argv.sboe});
        const votes = {};
        for (const row of rows) {
            if (!votes[row.contest]) {
                votes[row.contest] = {};
            }
            if (!votes[row.contest][row.candidate]) {
                votes[row.contest][row.candidate] = /Ward|ANC/.test(row.contest) ? {} : [];
                votes[row.contest][row.candidate][0] = row.party;
            }
            votes[row.contest][row.candidate][row.precinct] = row.votes;
        }
        const precinctToWard = await db.getPrecinctWardMapping(electionCode);
        const outputFile = __dirname + '/' + electionCode + '.json';
        const json = JSON.stringify(
            argv['ward-map'] ? precinctToWard : {votes, precinctToWard},
            null,
            argv.pretty ? 2 : 0
        );
        fs.writeFileSync(outputFile, json);
        console.warn('Written to', outputFile);
    }
}
