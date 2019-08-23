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
    contest_id: 'integer',
    contest_name: 'string',
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
                table.unique([
                    'code',
                    'contest_name',
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

db.close = function () {
    return knex.destroy();
};


module.exports = db;
