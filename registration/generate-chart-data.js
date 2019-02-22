#!/usr/bin/env node

const _ = require('lodash');
const db = require('./db');
const startDate = '2017-01-01';
const party = 'dem';
const ward = 4;

db.getTotalsForPartyAndWardByDate(party, ward, startDate)
    .then(function (totalsByDate) {
        const totals = Object.values(totalsByDate);
        db.getRecordsForWard(ward, startDate).then(function (records) {
            const dates = ['date'].concat(_.uniq(records.map(r => r.date)));
            process.stdout.write(JSON.stringify(dates) + ',\n');
            const precincts = _.uniq(records.map(r => r.precinct));
            for (const precinct of precincts) {
                const percentages = ['pct' + precinct].concat(records.filter(r => r.precinct === precinct)
                    .map((r, i) => +(100 * r[party] / totals[i]).toFixed(2)));
                process.stdout.write(JSON.stringify(percentages) + ',\n');
            }
            process.exit();
        });
    });

