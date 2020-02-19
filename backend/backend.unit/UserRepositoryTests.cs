using FluentAssertions;
using NUnit.Framework;

namespace backend.unit
{
    [TestFixture]
    public class Tests: RepositoryTestBase.UnitTestBase.SetUp
    {
        [TestCase(TestName = "WHEN connection open successfully THEN connection.state = 1")]
        public void Test1()
        {
            _colorDbConnection.State.Should().Be(1);
        }
    }
}