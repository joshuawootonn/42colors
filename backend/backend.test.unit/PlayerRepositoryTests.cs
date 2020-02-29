using System.Linq;
using backend.test.core;
using FluentAssertions;
using NUnit.Framework;

namespace backend.unit
{
    [TestFixture]
    public class PlayerRepositoryTests: RepositoryTestBase.UnitTestBase.SetUp
    {
        [TestCase(TestName = "WHEN connection open successfully THEN connection.state = 1")]
        public void Test1()
        {
            _colorDbConnection.State.Should().Be(1);
        }
        
        [TestCase(TestName = "WHEN insert THEN inserted value is returned")]
        public void Test2()
        {
            _playerRepository.insert(Good.createPlayerRequest).Should().BeEquivalentTo(Good.player);
        }
        
        [TestCase(TestName = "WHEN getAll THEN all are retreived")]
        public void Test3()
        {
            _playerRepository.getAll().ToArray().Length.Should().Be(0);
            _playerRepository.insert(Good.createPlayerRequest);
            _playerRepository.getAll().ToArray().Length.Should().Be(1);
            _playerRepository.insert(Good.createPlayerRequest);
            _playerRepository.insert(Good.createPlayerRequest);
            _playerRepository.getAll().ToArray().Length.Should().Be(3);
        }
        
        [TestCase(TestName = "WHEN getOne THEN gets that lad")]
        public void Test4()
        {
            _playerRepository.getById(1).Should().BeNull();
            _playerRepository.insert(Good.createPlayerRequest);
            _playerRepository.getById(1).Should().BeEquivalentTo(Good.player);
        }
    }
}