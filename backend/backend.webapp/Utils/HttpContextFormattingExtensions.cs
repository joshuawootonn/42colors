using System.Linq;
using Microsoft.AspNetCore.Http;

namespace backend.Utils
{
    public static class HttpContextFormattingExtensions
    {
        public static string formatHeaders(this HttpContext httpContext)
        {
            var headers = httpContext.Request.Headers;

            if (headers.Count == 0)
                return "None";

            return $@"
{headers.Keys.Select(key => $"{key}: {headers[key]}").toListText()}";
        }

        public static string formatQueryString(this HttpContext context)
        {
            if (context.Request.QueryString.ToString().Length == 0) return "None";

            return context.Request.QueryString.ToString();
        }
    }
}