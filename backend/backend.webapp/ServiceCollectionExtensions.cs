using System.Data;
using AspNetCoreRateLimit;
using backend.core.Utils;
using backend.Infrastructure;
using backend.Repositories;
using backend.Requests;
using Dapper;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using NetTopologySuite.Geometries;
using Npgsql;

namespace backend
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection addRateLimit(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddMemoryCache();
            services.Configure<IpRateLimitOptions>(configuration.GetSection("IpRateLimiting"));

            // TODO: this might be helpful if I catch a spammer
            // services.Configure<IpRateLimitPolicies>(configuration.GetSection("IpRateLimitPolicies"));

            services.AddSingleton<IIpPolicyStore, MemoryCacheIpPolicyStore>();
            services.AddSingleton<IRateLimitCounterStore, MemoryCacheRateLimitCounterStore>();

            services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
            services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();

            return services;
        }

        public static IServiceCollection addCors(this IServiceCollection services, string policy)
        {
            services.AddCors(options =>
            {
                options.AddPolicy(policy,
                    builder =>
                    {
                        builder.AllowAnyOrigin()
                            .AllowAnyHeader()
                            .AllowAnyMethod();
                    });
            });
            return services;
        }


        public static IServiceCollection addMvc(this IServiceCollection services)
        {
            services.AddMvc(options =>
                {
                    options.Filters.Add<RequestLoggingFilter>();
                    options.Filters.Add<ExceptionFilter>();
                }).AddFluentValidation(fv => fv
                    .RegisterValidatorsFromAssemblyContaining<LineRequestValidator>())
                .AddNewtonsoftJson();
            return services;
        }
        
        public static IServiceCollection addRepositories(this IServiceCollection services)
        {
            services.AddTransient<IPlayerRepository, PlayerRepository>();
            services.AddTransient<ILineRepository, LineRepository>();
            return services;
        }
        
        public static IServiceCollection addDbConnection(this IServiceCollection services, string connectionString)
        {
            services.AddScoped<IDbConnection>(_ =>
            {
                var connection = new NpgsqlConnection(new NpgsqlConnectionStringBuilder(connectionString).ConnectionString);
                connection.Open();
                connection.TypeMapper.UseNetTopologySuite();
                SqlMapper.AddTypeHandler(new GeometryHandler<LineString>());
                return connection;
            });
            return services;
        }
    }
}