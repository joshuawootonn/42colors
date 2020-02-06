using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace backend.integration.Services
{
    public class TestApplicationFactory: WebApplicationFactory<Startup>
    {
        protected override IWebHostBuilder CreateWebHostBuilder()
        {
            return Program.CreateHostBuilder(new string[0]);
        }
    }
}