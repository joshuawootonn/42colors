using System.Linq;
using backend.core.Commands;
using backend.core.Models;
using backend.Requests;
using backend.test.core;
using FluentAssertions;
using NUnit.Framework;

namespace backend.unit
{
    [TestFixture]
    public class LineRepositoryTests : RepositoryTestBase.UnitTestBase.SetUp
    {
        [TestCase(TestName = "WHEN connection open successfully THEN connection.state = 1")]
        public void Test1()
        {
            _colorDbConnection.State.Should().Be(1);
        }

        [TestCase(TestName = "WHEN insert THEN inserted value is returned")]
        public void Test2()
        {
            _lineRepository.insert(Good.lineRequest.toCmd()).Should().BeEquivalentTo(Good.line);
        }

        [TestCase(TestName = "WHEN getAll THEN all are retreived")]
        public void Test3()
        {
            _lineRepository.getAll().ToArray().Length.Should().Be(0);
            _lineRepository.insert(Good.lineRequest.toCmd());
            _lineRepository.getAll().ToArray().Length.Should().Be(1);
            _lineRepository.insert(Good.lineRequest.toCmd());
            _lineRepository.insert(Good.lineRequest.toCmd());
            _lineRepository.insert(Good.lineRequest.toCmd());
            _lineRepository.getAll().ToArray().Length.Should().Be(4);
        }

        [TestCase(TestName = "WHEN getByMapPosition THEN only lines with mapPosition are fetched")]
        public void Test4()
        {
            _lineRepository.getByMapPosition(Good.mapPosition).ToArray().Length.Should().Be(0);
            _lineRepository.insert(Good.lineRequestWithinMapPosition.toCmd());
            _lineRepository.getByMapPosition(Good.mapPosition).ToArray().Length.Should().Be(1);
            _lineRepository.insert(Bad.linePartiallyInside.toCmd());
            _lineRepository.getByMapPosition(Good.mapPosition).ToArray().Length.Should().Be(1);
            _lineRepository.insert(Bad.lineOutside.toCmd());
            _lineRepository.getByMapPosition(Good.mapPosition).ToArray().Length.Should().Be(1);
        }
    }
}