using System;
using System.Data;
using backend.integration.Services;
using backend.Repositories;
using backend.test.core;
using Microsoft.Extensions.Configuration;
using Npgsql;
using NUnit.Framework;

namespace backend.unit
{
    public class RepositoryTestBase
    {
        [TestFixture]
        public abstract class UnitTestBase
        {
            private UnitTestBase()
            {
                // nop    
            }

            public abstract class SetUp : UnitTestBase
            {
                [SetUp]
                public void setUpClass()
                {
                    createResources();
                }

                [TearDown]
                public void tearDownClass()
                {
                    disposeResources();
                }
            }

            public abstract class OneTimeSetUp : UnitTestBase
            {
                [OneTimeSetUp]
                public void setUpClass()
                {
                    createResources();
                }

                [OneTimeTearDown]
                public void tearDownClass()
                {
                    disposeResources();
                }
            }
            
            private static IConfiguration Configuration { get; set; }
            protected static IDbConnection _colorDbConnection;
            protected static PlayerRepository _playerRepository { get; set; }
            protected static LineRepository _lineRepository { get; set; }

            protected static void createResources()
            {
                var connectionString = Environment.GetEnvironmentVariable("COLOR_CONNECTIONSTRING");
                _colorDbConnection = new NpgsqlConnection(new NpgsqlConnectionStringBuilder(connectionString).ConnectionString);
                _colorDbConnection.Open();

                new ColorDatabase(_colorDbConnection).clean();
                
                _playerRepository = new PlayerRepository(_colorDbConnection);
                _lineRepository = new LineRepository(_colorDbConnection);
            }

            protected static void disposeResources()
            {
                _colorDbConnection?.Dispose();
            }
        }
    }
}