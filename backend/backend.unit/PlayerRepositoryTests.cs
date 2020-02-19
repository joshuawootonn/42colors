using System.Linq;
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
        
        [TestCase(TestName = "WHEN insert THEN inserted value is returned")]
        public void Test2()
        {
            var createPlayerRequest = integration.Good.Requests.createPlayerRequest;
            _playerRepository.insert(createPlayerRequest).Should().Be(integration.Good.Models.player);
        }
        
        [TestCase(TestName = "WHEN getAll THEN all are retreived")]
        public void Test3()
        {
            var enumerable = _playerRepository.getAll();
            enumerable.ToArray().Length.Should().Be(4);
        }
    }
}