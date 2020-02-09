using AspNetCoreRateLimit;
using backend.Infrastructure;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

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

            services.AddCors(options =>
            {
                options.AddPolicy(MYCORSPOLICY,
                    builder =>
                    {
                        builder.AllowAnyOrigin()
                            .AllowAnyHeader()
                            .AllowAnyMethod();
                    });
            });
            services.AddMvc(options =>
            {
                options.Filters.Add<RequestLoggingFilter>();
                options.Filters.Add<ExceptionFilter>();
            }).AddNewtonsoftJson();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {     
            
            app.UseIpRateLimiting();
            if (env.IsDevelopment()) app.UseDeveloperExceptionPage();

      

            app.UseRouting();


            app.UseCors(MYCORSPOLICY);

            app.UseEndpoints(endpoints => { endpoints.MapControllers(); });
        }
    }
}