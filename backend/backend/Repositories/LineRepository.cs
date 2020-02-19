using System.Collections;
using System.Collections.Generic;
using System.Data;
using backend.Models;
using Dapper;

namespace backend.Repositories
{
    public class LineRepository
    {
        private readonly IDbConnection _colorDbConnection;

        public LineRepository(IDbConnection colorDbConnection)
        {
            _colorDbConnection = colorDbConnection;
        }

        public void insert(Line line)
        {
            if ((_colorDbConnection.State & ConnectionState.Open) == 0)
                _colorDbConnection.Open();
//             using (var transaction = _colorDbConnection.BeginTransaction())
//             {
//                 _colorDbConnection.Execute(@"
// INSERT INTO ")
//             }
        }
    }
}