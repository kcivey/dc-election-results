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
        );
};

db.insertRegistrationRecords = function (records) {
    return knex.batchInsert(statsTableName, records, 50);
};

db.getRecordsForWard = function (ward, startDate) {
    return knex.select()
        .from(statsTableName)
        .where('ward', ward)
        .andWhere('date', '>=', startDate || '2000-01-01')
        .orderBy('date')
        .orderBy('precinct');
};

db.getTotalsForPartyAndWardByDate = function (party, ward, startDate) {
    return knex.select('date')
        .sum(`${party} as total`)
        .from(statsTableName)
        .where('ward', ward)
        .andWhere('date', '>=', startDate || '2000-01-01')
        .orderBy('date')
        .groupBy('date')
        .then(records => {
            const totalsByDate = {};
            for (const record of records) {
                totalsByDate[record.date] = record.total;
            }
            return totalsByDate;
        })
};

module.exports = db;
