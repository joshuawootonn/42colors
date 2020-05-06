using System.Linq;
using System.Threading.Tasks;
using backend.test.core;
using backend.Views;
using FluentAssertions;
using NUnit.Framework;

namespace backend.integration.ControllerTests
{
    public class LineControllerTests : ControllerTestBase.IntegrationTestBase.SetUp
    {
        [TestCase(TestName = "WHEN get:diagnostic:ok THEN 200")]
        public async Task test()
        {
            var getLinesResponse = await backendClient.getOk();
        }

        [TestCase(TestName = "WHEN get:lines and lines are empty THEN 200")]
        public async Task test0()
        {
            var getLinesResponse = await backendClient.getLines();
            getLinesResponse.StatusCode.Should().Be(200);
            var response = await getLinesResponse.GetJsonAsync<LinesViewModel>();
            response.lines.Length.Should().Be(0);
        }

        [TestCase(TestName = "WHEN get:lines and there are 10 lines THEN 10 lines and 200")]
        public async Task test021345()
        {
            Task.WaitAll(Enumerable.Range(0, 10).Select(i => backendClient.postLine(Good.lineRequest))
                .ToArray());

            var getLinesResponse = await backendClient.getLines();
            getLinesResponse.StatusCode.Should().Be(200);
            var response = await getLinesResponse.GetJsonAsync<LinesViewModel>();
            response.lines.Length.Should().Be(10);
        }

        [TestCase(TestName = "WHEN get:linesByMapPosition and lines are empty THEN 200")]
        public async Task test01()
        {
            var getLinesResponse = await backendClient.getLinesByMapPosition(Good.mapPosition);
            getLinesResponse.StatusCode.Should().Be(200);
            var response = await getLinesResponse.GetJsonAsync<LinesViewModel>();
            response.lines.Length.Should().Be(0);
        }
        
        [TestCase(TestName = "WHEN get:linesByMapPosition THEN 200 excluding lines partially in mapPosition")]
        public async Task test07681()
        {
            await backendClient.postLine(Good.lineRequestWithinMapPosition);
            await backendClient.postLine(Bad.linePartiallyInside);
            var getLinesResponse = await backendClient.getLinesByMapPosition(Good.mapPosition);
            getLinesResponse.StatusCode.Should().Be(200);
            var response = await getLinesResponse.GetJsonAsync<LinesViewModel>();
            response.lines.Length.Should().Be(1);
        }
        
        [TestCase(TestName = "WHEN get:linesByMapPosition THEN 200 excluding lines completely outside in mapPosition")]
        public async Task test0768231()
        {
            await backendClient.postLine(Good.lineRequestWithinMapPosition);
            await backendClient.postLine(Bad.lineOutside);
            var getLinesResponse = await backendClient.getLinesByMapPosition(Good.mapPosition);
            getLinesResponse.StatusCode.Should().Be(200);
            var response = await getLinesResponse.GetJsonAsync<LinesViewModel>();
            response.lines.Length.Should().Be(1);
        }

        [TestCase(TestName = "Rate Limit: WHEN post:line reachs request limit and then waits 10s THEN 429")]
        public async Task test1()
        {
            Task.WaitAll(Enumerable.Range(0, 10).Select(i => backendClient.postLine(Good.lineRequest))
                .ToArray());
            Task.Delay(10000).Wait();
            (await backendClient.postLine(Good.lineRequest)).statusCode.Should().Be(200);
        }

        [TestCase(TestName = "Rate Limit: WHEN post:line requests more than 10x in 10s THEN 429")]
        public async Task test2()
        {
            Task.WaitAll(Enumerable.Range(0, 10).Select(i => backendClient.postLine(Good.lineRequest))
                .ToArray());
            (await backendClient.postLine(Good.lineRequest)).statusCode.Should().Be(429);
        }

        [TestCase(TestName = "Validator: WHEN post:line with valid line THEN 200")]
        public async Task test3()
        {
            (await backendClient.postLine(Good.lineRequest)).statusCode.Should().Be(200);
        }

        [TestCase(TestName = "Validator: WHEN post:line with invalid brushColor hex THEN 400")]
        public async Task test4()
        {
            (await backendClient.postLine(Bad.lineWithInvalidHex)).statusCode.Should().Be(400);
        }

        [TestCase(TestName = "Validator: WHEN post:line with brushRadius of 0 THEN 400")]
        public async Task test5()
        {
            (await backendClient.postLine(Bad.lineWith0BrushRadius)).statusCode.Should().Be(400);
        }

        [TestCase(TestName = "Validator: WHEN post:line with brushRadius of 101 THEN 400")]
        public async Task test6()
        {
            (await backendClient.postLine(Bad.lineWith101BrushRadius)).statusCode.Should().Be(400);
        }

        [TestCase(TestName = "Validator: WHEN post:line with empty points[] THEN 400")]
        public async Task test7()
        {
            (await backendClient.postLine(Bad.lineWithEmptyPoints)).statusCode.Should().Be(400);
        }
    }
}