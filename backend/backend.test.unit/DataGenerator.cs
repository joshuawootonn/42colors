using System.Linq;
using backend.test.core;
using FluentAssertions;
using NUnit.Framework;

namespace backend.unit
{
    [TestFixture]
    public class DataGenerator : RepositoryTestBase.UnitTestBase.SetUp
    {
        [Test]
        // [Ignore()]
        public void insertAThousandLines()
        {
            // foreach (var _ in Enumerable.Range(0, 400).ToArray())
            // {
            //     var aaa = Good.lineRequest.toCmd();
            //     _lineRepository.insert(aaa);
            //     
            // }
        }
    }
}