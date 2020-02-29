using System.Linq;
using backend.Models;
using backend.test.core;
using FluentAssertions;
using NUnit.Framework;

namespace backend.unit
{
    [TestFixture]
    public class LineRepositoryTests: RepositoryTestBase.UnitTestBase.SetUp
    {
        [TestCase(TestName = "WHEN connection open successfully THEN connection.state = 1")]
        public void Test1()
        {
            _colorDbConnection.State.Should().Be(1);
        }
        
        [TestCase(TestName = "WHEN insert THEN inserted value is returned")]
        public void Test2()
        {
            _lineRepository.insert(Good.line2).Should().BeEquivalentTo(Good.line2);
        }
        
        [TestCase(TestName = "WHEN getAll THEN all are retreived")]
        public void Test3()
        {
            _lineRepository.getAll().ToArray().Length.Should().Be(0);
            _lineRepository.insert(Good.line2);
            _lineRepository.getAll().ToArray().Length.Should().Be(1);
            
        }
    }
}