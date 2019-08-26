const path = require('path');
const knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: path.dirname(__dirname) + '/results.sqlite',
    },
    useNullAsDefault: true,
});
const db = {};
const resultsTableName = 'results';
const resultsColumns = {
    code: 'string',
    election_date: 'date',
    election_name: 'string',
    contest: 'string',
    precinct: 'integer',
    ward: 'integer',
    candidate: 'string',
    party: 'string',
    votes: 'integer',
};
const defaultBatchSize = 50;

db.createTables = async function () {
    return knex.schema.dropTableIfExists(resultsTableName)
        .createTable(
            resultsTableName,
            function (table) {
                for (const [column, type] of Object.entries(resultsColumns)) {
                    table[type](column);
                }
                table.index('precinct');
                table.unique([
                    'code',
                    'contest',
                    'precinct',
                    'candidate',
                    'party',
                ]);
            }
        );
};

db.insertResultRecords = function (records, batchSize = defaultBatchSize) {
    return knex.batchInsert(resultsTableName, records, batchSize);
};

db.deleteResultRecords = function (year = null) {
    const query = knex(resultsTableName);
    if (year) {
        query.whereBetween('election_date', [`${year}-01-01`, `${year}-12-31`]);
    }
    return query.del();
};

db.getMostRecentElectionCode = function () {
    return knex(resultsTableName)
        .max('code', {as: 'code'})
        .then(rows => rows[0].code);
};

db.getResults = function (electionCode, {party = null, anc = true, sboe = true} = {}) {
    const query = knex(resultsTableName)
        .select(
            'contest',
            'precinct',
            'candidate',
            'party',
            'votes',
        )
        .where('code', electionCode);
    if (party) {
        query.where('party', party);
    }
    if (!anc) {
        query.whereNot('contest', 'LIKE', 'ANC%');
    }
    if (!sboe) {
        query.whereNot('contest', 'LIKE', 'SBOE%');
    }
    return query.orderBy([
        'contest',
        'party',
        'candidate',
        'precinct',
    ]);
};

db.getPrecinctWardMapping = function (electionCode) {
    return knex(resultsTableName)
        .select(
            'ward',
            knex.raw('GROUP_CONCAT(precinct) AS precincts'),
        )
        .where('code', electionCode)
        .where('ward', '>', 0)
        .groupBy('ward')
        .orderBy('ward')
        .then(function (rows) {
            const mapping = [];
            for (const row of rows) {
                row.precincts.split(',')
                    .forEach(p => mapping[p] = row.ward);
            }
            for (let i = 0; i < mapping.length; i++) {
                if (!mapping[i]) {
                    mapping[i] = 0;
                }
            }
            return mapping;
        });
};

db.setWardFor2010General = function () {
    return knex.raw(
        `UPDATE results
        SET ward = (
            SELECT ward
            FROM results r2
            WHERE r2.precinct = results.precinct
                AND r2.code = '20100914P'
            LIMIT 1
        )
        WHERE code = '20101102G'
            AND ward IS NULL`
    );
};

db.getElectionCodes = function () {
    return knex(resultsTableName)
        .distinct('code')
        .orderBy('code')
        .pluck('code');
};

db.close = function () {
    return knex.destroy();
};


module.exports = db;
