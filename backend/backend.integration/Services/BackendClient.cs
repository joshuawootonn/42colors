using System;
using System.Net.Http;
using System.Threading.Tasks;
using backend.integration.Utils;
using backend.Requests;
using backend.Views;
using Flurl.Http;

namespace backend.integration.Services
{
    public class BackendClient : IDisposable
    {
        private readonly FlurlClient _flurlClient;


        private BackendClient(FlurlClient flurlClient)
        {
            _flurlClient = flurlClient;
        }

        public void Dispose()
        {
            _flurlClient?.Dispose();
        }

        public static BackendClient create(HttpClient httpClient)
        {
            var flurlClient = new FlurlClient(httpClient)
                .AllowAnyHttpStatus();
            return new BackendClient(flurlClient);
        }

        public async Task<GetLinesView> getLines()
        {
            return await _flurlClient
                .Request("api/lines")
                .GetJsonAsync();
        }

        public async Task<Response<Empty>> postLine(CreateLineRequest lineRequest)
        {
            return await _flurlClient
                .Request("api/line")
                .PostJsonAsync(lineRequest)
                .toResponse<Empty>();
        }
    }
}