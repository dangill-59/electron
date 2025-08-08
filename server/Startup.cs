using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using DocumentDmsServer.Services;
using System.Text;

public class Startup
{
    public IConfiguration Configuration { get; }

    public Startup(IConfiguration configuration)
    {
        Configuration = configuration;
    }

    // This method gets called by the runtime. Use this method to add services to the container.
    public void ConfigureServices(IServiceCollection services)
    {
        // Register your service classes for DI
        services.AddSingleton<UserDb>();
        services.AddSingleton<ProjectDb>();
        services.AddSingleton<RoleDb>();

        services.AddControllers();

        // JWT Authentication
        var jwtKey = Configuration["Jwt:Key"];
        Console.WriteLine("DEBUG: JWT Key from config: '" + jwtKey + "'");
        Console.WriteLine("DEBUG: JWT Key length: " + (jwtKey?.Length ?? 0));
        if (string.IsNullOrEmpty(jwtKey))
            throw new Exception("JWT Key is not configured in appsettings.json or environment variables.");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = Configuration["Jwt:Issuer"],
                    ValidAudience = Configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
                };
            });
        services.AddAuthorization();
    }

    // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        // Force documentdms.db and user table creation at startup
        var userDb = new UserDb();
        var roleDb = new RoleDb();

        // Run migration script
        RunMigrationScript();

        // Seed 'sa' user if not present
        if (userDb.GetUserByUsername("sa") == null)
        {
            userDb.AddUser("sa", "SR2025$!", "superadmin");
            Console.WriteLine("Seeded 'sa' user with default password.");
            
            // Also add sa to superadmin role in new system
            var superadminRole = roleDb.GetRoleByName("superadmin");
            if (superadminRole != null)
            {
                var saUser = userDb.GetUserByUsername("sa");
                if (saUser != null)
                {
                    userDb.AddRoleToUser(saUser.Id, superadminRole.Id);
                    Console.WriteLine("Assigned superadmin role to sa user.");
                }
            }
        }

        if (env.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
        }

        app.UseRouting();
        app.UseAuthentication();
        app.UseAuthorization();

        app.UseEndpoints(endpoints =>
        {
            endpoints.MapControllers();
        });
    }

    private void RunMigrationScript()
    {
        try
        {
            var migrationScript = File.ReadAllText(Path.Combine(Directory.GetCurrentDirectory(), "..", "migration.sql"));
            var connectionString = "Data Source=documentdms.db";
            
            using var connection = new Microsoft.Data.Sqlite.SqliteConnection(connectionString);
            connection.Open();
            
            // Split script by semicolons and execute each statement
            var statements = migrationScript.Split(new[] { ';' }, StringSplitOptions.RemoveEmptyEntries);
            
            foreach (var statement in statements)
            {
                var trimmedStatement = statement.Trim();
                if (!string.IsNullOrEmpty(trimmedStatement) && !trimmedStatement.StartsWith("--"))
                {
                    using var command = connection.CreateCommand();
                    command.CommandText = trimmedStatement;
                    command.ExecuteNonQuery();
                }
            }
            
            Console.WriteLine("Migration script executed successfully.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error running migration script: {ex.Message}");
            // Continue startup even if migration fails
        }
    }
}