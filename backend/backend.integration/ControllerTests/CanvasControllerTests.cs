using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using NUnit.Framework;

namespace backend.integration.ControllerTests
{
    public class CanvasControllerTests : ControllerTestBase.IntegrationTestBase.SetUp
    {
        [TestCase(TestName = "Rate Limit: WHEN post:line reachs request limit and then waits 10s THEN 429")]
        public async Task test1()
        {
            Task.WaitAll(Enumerable.Range(0, 10).Select(i => backendClient.postLine(Good.Requests.line))
                .ToArray());
            Task.Delay(10000).Wait();
            (await backendClient.postLine(Good.Requests.line)).statusCode.Should().Be(200);
        }
        [TestCase(TestName = "Rate Limit: WHEN post:line requests more than 10x in 10s THEN 429")]
        public async Task test2()
        {
            Task.WaitAll(Enumerable.Range(0, 10).Select(i => backendClient.postLine(Good.Requests.line))
                .ToArray());
            (await backendClient.postLine(Good.Requests.line)).statusCode.Should().Be(429);
        }

        [TestCase(TestName = "Validator: WHEN post:line with valid line THEN 200")]
        public async Task test3()
        {
            (await backendClient.postLine(Good.Requests.line)).statusCode.Should().Be(200);
        }
        [TestCase(TestName = "Validator: WHEN post:line with invalid brushColor hex THEN 400")]
        public async Task test4()
        {
            (await backendClient.postLine(Bad.Requests.lineWithInvalidHex)).statusCode.Should().Be(400);
        }
        
        [TestCase(TestName = "Validator: WHEN post:line with brushRadius of 0 THEN 400")]
        public async Task test5()
        {
            (await backendClient.postLine(Bad.Requests.lineWith0BrushRadius)).statusCode.Should().Be(400);
        }
        [TestCase(TestName = "Validator: WHEN post:line with brushRadius of 101 THEN 400")]
        public async Task test6()
        {
            (await backendClient.postLine(Bad.Requests.lineWith101BrushRadius)).statusCode.Should().Be(400);
        }
        [TestCase(TestName = "Validator: WHEN post:line with empty points[] THEN 400")]
        public async Task test7()
        {
            (await backendClient.postLine(Bad.Requests.lineWithEmptyPoints)).statusCode.Should().Be(400);
        }
        
    }
}