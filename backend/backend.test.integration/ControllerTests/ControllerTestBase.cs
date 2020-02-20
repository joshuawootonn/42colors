using backend.integration.Services;
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

            protected static void createResources()
            {
                _testApplicationFactory = new TestApplicationFactory();
                backendClient = BackendClient.create(_testApplicationFactory.CreateClient());
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