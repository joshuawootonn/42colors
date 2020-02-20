using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Flurl.Http;
using Newtonsoft.Json;

namespace backend.integration.Utils
{
    public static class HttpResponseMessageExtensions
    {
        public static async Task<Response<T>> toResponse<T>(this Task<IFlurlResponse> httpResponseMessageTask)
        {
            var httpResponseMessage = await httpResponseMessageTask;

            var contentAsString = await httpResponseMessage.GetStringAsync();

            return new Response<T>
            {
                content = contentAsString,
                statusCode = httpResponseMessage.StatusCode,
                model = tryDeserializeJson<T>(contentAsString),
                errors = tryDeserializeJson<BusinessErrorsResponse>(contentAsString)?.errors
            };
        }

        private static T tryDeserializeJson<T>(string jsonText)
        {
            try
            {
                return JsonConvert.DeserializeObject<T>(jsonText);
            }
            catch (Exception)
            {
                return default;
            }
        }

        // ReSharper disable once ClassNeverInstantiated.Local
        private class BusinessErrorsResponse
        {
            // ReSharper disable once UnusedAutoPropertyAccessor.Local
            public IDictionary<string, string[]> errors { get; set; }
        }
    }
}