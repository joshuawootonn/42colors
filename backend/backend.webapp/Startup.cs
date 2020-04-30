using AspNetCoreRateLimit;
using backend.Hubs;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace backend
{
    public class Startup
    {
        public string MYCORSPOLICY = "foo";

        public Startup(IConfiguration configuration)
        {
            this.configuration = configuration;
        }

        private IConfiguration configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            services.AddOptions();
            services.addRateLimit(configuration);
            services.AddControllers();
            services.addSignalR();
            services.addCors(MYCORSPOLICY);
            services.addMvc();
            services.addDbConnection(configuration["connectionString"]);
            services.addRepositories();
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            app.UseIpRateLimiting();
            // if (env.IsDevelopment())
            // {
            app.UseDeveloperExceptionPage();
            // }

            app.UseCors(MYCORSPOLICY);
            app.UseRouting();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapHub<LineHub>("/lineHub");
                endpoints.MapControllers();
            });
        }
    }
}