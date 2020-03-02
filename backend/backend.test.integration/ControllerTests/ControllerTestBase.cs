using System;
using backend.integration.Services;
using backend.test.core;
using Npgsql;
using NUnit.Framework;

namespace backend.integration.ControllerTests
{
    public class ControllerTestBase
    {
        [TestFixture]
        public abstract class IntegrationTestBase
        {
            private IntegrationTestBase()
            {
                // nop    
            }

            public abstract class SetUp : IntegrationTestBase
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

            public abstract class OneTimeSetUp : IntegrationTestBase
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

            private static TestApplicationFactory _testApplicationFactory;
            private static NpgsqlConnection _colorDbConnection;

            protected static void createResources()
            {
                _testApplicationFactory = new TestApplicationFactory();
                backendClient = BackendClient.create(_testApplicationFactory.CreateClient());
                var connectionString = Environment.GetEnvironmentVariable("COLOR_CONNECTIONSTRING");
                _colorDbConnection =
                    new NpgsqlConnection(new NpgsqlConnectionStringBuilder(connectionString).ConnectionString);
                _colorDbConnection.Open();
                new ColorDatabase(_colorDbConnection).clean();
            }

            protected static void disposeResources()
            {
                _testApplicationFactory?.Dispose();
                backendClient?.Dispose();
            }

            protected static BackendClient backendClient { get; private set; }
        }
    }
}