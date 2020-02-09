using System.Linq;
using System.Threading.Tasks;
using backend.Requests;
using FluentAssertions;
using NUnit.Framework;

namespace backend.integration.ControllerTests
{
    public class CanvasControllerTests : ControllerTestBase.IntegrationTestBase.SetUp
    {
        [Test]
        public async Task WHEN_11_in_10s_THEN_status_429()
        {
            Task.WaitAll(Enumerable.Range(0, 10).Select(i => backendClient.postLine(new PostLine(Good.line)))
                .ToArray());
            (await backendClient.postLine(new PostLine(Good.line))).statusCode.Should().Be(429);
        }
        [Test]
        public async Task WHEN_10s_is_awaited_THEN_status_200()
        {
            Task.WaitAll(Enumerable.Range(0, 10).Select(i => backendClient.postLine(new PostLine(Good.line)))
                .ToArray());
            Task.Delay(10000);
        }
    }
}