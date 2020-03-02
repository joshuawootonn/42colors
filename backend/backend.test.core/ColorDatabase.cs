using System.Data;
using Dapper;

namespace backend.test.core
{
    public class ColorDatabase
    {
        private readonly IDbConnection _dbConnection;

        public ColorDatabase(IDbConnection dbConnection)
        {
            _dbConnection = dbConnection;
        }

        public void clean()
        {
            _dbConnection.Execute(@"
truncate table line RESTART IDENTITY CASCADE;
truncate table player RESTART IDENTITY CASCADE;
");
        }
    }
}