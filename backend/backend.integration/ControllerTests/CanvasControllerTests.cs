using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using NUnit.Framework;

namespace backend.integration.ControllerTests
{
    public class CanvasControllerTests : ControllerTestBase.IntegrationTestBase.SetUp
    {
        [Test,Description("Rate Limit: WHEN_10s_is_awaited_THEN_status_200")]
        public async Task Rate_Limit_WHEN_10s_is_awaited_THEN_status_200()
        {
            Task.WaitAll(Enumerable.Range(0, 10).Select(i => backendClient.postLine(Good.Requests.line))
                .ToArray());
            Task.Delay(10000).Wait();
            (await backendClient.postLine(Good.Requests.line)).statusCode.Should().Be(200);
        }

        [Test,Description("Rate Limit: WHEN_11_in_10s_THEN_status_429")]
        public async Task Rate_Limit_WHEN_11_in_10s_THEN_status_429()
        {
            Task.WaitAll(Enumerable.Range(0, 10).Select(i => backendClient.postLine(Good.Requests.line))
                .ToArray());
            (await backendClient.postLine(Good.Requests.line)).statusCode.Should().Be(429);
        }

        [Test]
        public async Task Validator_POST_line_WHEN_happy_THEN_400()
        {
            (await backendClient.postLine(Good.Requests.line)).statusCode.Should().Be(200);
        }
        [Test]
        public async Task Validator_POST_line_WHEN_1_THEN_400()
        {
            (await backendClient.postLine(Bad.Requests.lineWithInvalidHex)).statusCode.Should().Be(400);
        }
        
        [Test]
        public async Task Validator_POST_line_WHEN_2_THEN_400()
        {
            (await backendClient.postLine(Bad.Requests.lineWith0BrushRadius)).statusCode.Should().Be(400);
        }
        [Test]
        public async Task Validator_POST_line_WHEN_3_THEN_400()
        {
            (await backendClient.postLine(Bad.Requests.lineWith101BrushRadius)).statusCode.Should().Be(400);
        }
        
        [Test]
        public async Task Validator_POST_line_WHEN_4_THEN_400()
        {
            (await backendClient.postLine(Bad.Requests.lineWithEmptyPoints)).statusCode.Should().Be(400);
        }
        
    }
}