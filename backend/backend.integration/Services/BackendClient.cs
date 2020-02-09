using System;
using System.Net.Http;
using System.Threading.Tasks;
using backend.integration.Utils;
using backend.Models;
using backend.Requests;
using backend.Views;
using Flurl.Http;

namespace backend.integration.Services
{
    public class BackendClient: IDisposable
    {
        private readonly FlurlClient _flurlClient;

        public static BackendClient create(HttpClient httpClient)
        {
            var flurlClient = new FlurlClient(httpClient)
                .AllowAnyHttpStatus();
            return new BackendClient(flurlClient);
        }

        public async Task<GetLines> getLines()
        {
            return await _flurlClient
                .Request($"api/lines")
                .GetJsonAsync();
        }

        public async Task<Response<Empty>> postLine(PostLine line)
        {
            return await _flurlClient
                .Request("api/line")
                .PostJsonAsync(line)
                .toResponse<Empty>();
        }
        
        
        private BackendClient(FlurlClient flurlClient)
        {
            _flurlClient = flurlClient;
        }

        public void Dispose()
        {
            _flurlClient?.Dispose();
        }
    }
}