#!/usr/bin/env node

const argv = require('yargs')
    .options({
        anc: {
            type: 'boolean',
            describe: 'include advisory neighborhood commissioners (use --no-anc to omit)',
        },
        election: {
            type: 'string',
            describe: 'election code (eg, 20181106G); defaults to most recent',
            requiresArg: true,
        },
        party: {
            type: 'string',
            describe: 'party (only for primaries',
            requiresArg: true,
        },
        pretty: {
            type: 'boolean',
            describe: 'pretty-print the JSON',
        },
        sboe: {
            type: 'boolean',
            describe: 'include State Board of Education (use --no-sboe to omit)',
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
    if (!/P$/.test(electionCode) && party) {
        console.warn('Ignoring party since election is not a primary');
        party = null;
    }
    console.warn('getting', electionCode);
    const rows = await db.getResults(electionCode, {party, anc: argv.anc, sboe: argv.sboe});
    const data = {};
    for (const row of rows) {
        if (!data[row.contest_name]) {
            data[row.contest_name] = {};
        }
        if (!data[row.contest_name][row.candidate]) {
            data[row.contest_name][row.candidate] = /Ward|ANC/.test(row.contest_name) ? {} : [];
            data[row.contest_name][row.candidate][0] = row.party
        }
        data[row.contest_name][row.candidate][row.precinct] = row.votes;
    }
    process.stdout.write(JSON.stringify(data, null, argv.pretty ? 2 : 0));
}
