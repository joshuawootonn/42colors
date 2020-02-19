using System;
using System.Data;
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

            protected static void createResources()
            {
                var connectionString = Environment.GetEnvironmentVariable("COLOR_CONNECTIONSTRING");
                _colorDbConnection = new NpgsqlConnection(new NpgsqlConnectionStringBuilder(connectionString).ConnectionString);
                _colorDbConnection.Open();
            }

            protected static void disposeResources()
            {
                _colorDbConnection?.Dispose();
            }
        }
    }
}