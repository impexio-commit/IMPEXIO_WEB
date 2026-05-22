using ImpexioAPI.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var conn = builder.Configuration.GetConnectionString("DefaultConnection")!;
builder.Services.AddSingleton(new DbConnectionFactory(conn));
builder.Services.AddScoped<CbmRepository>();
builder.Services.AddScoped<FobRepository>();
builder.Services.AddScoped<EcRepository>();
builder.Services.AddScoped<Ec2Repository>();
builder.Services.AddScoped<PiRepository>();
builder.Services.AddScoped<EqRepository>();
builder.Services.AddScoped<SciRepository>();
builder.Services.AddScoped<IleRepository>();
builder.Services.AddScoped<BilRepository>();

var app = builder.Build();

app.UseDeveloperExceptionPage();
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();
app.Run();