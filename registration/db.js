const knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: __dirname + '/registration-stats.sqlite'
    },
    useNullAsDefault: true
});
const db = {};
const statsTableName = 'stats';

db.createTables = function () {
    return knex.schema.dropTableIfExists(statsTableName)
        .createTable(
            statsTableName,
            function (table) {
                table.date('date');
                [
                    'precinct',
                    'ward',
                    'dem',
                    'rep',
                    'stg',
                    'lib',
                    'np',
                    'oth',
                    'totals'
                ].forEach(col => table.integer(col));
                table.unique(['date', 'precinct'])
            }
        )
};

db.insertRegistrationRecords = function (records) {
    return knex.batchInsert(statsTableName, records, 50);
};

module.exports = db;
