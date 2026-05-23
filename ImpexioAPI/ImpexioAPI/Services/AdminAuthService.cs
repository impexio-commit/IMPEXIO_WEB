using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using ImpexioAPI.Models;
using ImpexioAPI.Repositories;

namespace ImpexioAPI.Services
{
    public class AdminAuthService
    {
        private readonly AdminRepository _repo;
        private readonly IConfiguration _config;

        public AdminAuthService(AdminRepository repo, IConfiguration config)
        {
            _repo = repo;
            _config = config;
        }

        // ── UNIFIED LOGIN ─────────────────────────────────────
        // Same endpoint for Owner + Customer
        public async Task<AdminLoginResponse?> LoginAsync(AdminLoginRequest req)
        {
            // 1. Check if Owner first
            var owner = await _repo.GetOwnerByEmailAsync(req.Email);
            if (owner != null)
            {
                // First time setup
                if (owner.PasswordHash == "SETUP")
                {
                    var hash = BCrypt.Net.BCrypt.HashPassword(req.Password);
                    await _repo.UpdateOwnerPasswordAsync(owner.Id, hash);
                    owner.PasswordHash = hash;
                }

                if (!BCrypt.Net.BCrypt.Verify(req.Password, owner.PasswordHash))
                    return null;

                await _repo.UpdateOwnerLastLoginAsync(owner.Id);

                return new AdminLoginResponse
                {
                    Token = GenerateToken(owner.Id, owner.Email, owner.FullName, "Owner", null, null),
                    FullName = owner.FullName,
                    Email = owner.Email,
                    Role = "Owner",
                    Expiry = DateTime.UtcNow.AddHours(12)
                };
            }

            // 2. Check Customer User
            var custUser = await _repo.GetCustomerUserByEmailAsync(req.Email);
            if (custUser != null)
            {
                // Check customer is active
                if (custUser.CustomerActive == false)
                    return null;

                // First time setup
                if (custUser.PasswordHash == "SETUP")
                {
                    var hash = BCrypt.Net.BCrypt.HashPassword(req.Password);
                    await _repo.UpdateCustomerUserPasswordAsync(custUser.Id, hash);
                    custUser.PasswordHash = hash;
                }

                if (!BCrypt.Net.BCrypt.Verify(req.Password, custUser.PasswordHash))
                    return null;

                // Check active subscription
                var sub = await _repo.GetActiveSubscriptionAsync(custUser.CustomerId);
                if (sub == null)
                    return null; // No active subscription

                await _repo.UpdateCustomerUserLastLoginAsync(custUser.Id);

                return new AdminLoginResponse
                {
                    Token = GenerateToken(custUser.Id, custUser.Email, custUser.FullName, "Customer", custUser.ClientCode, custUser.CompanyName),
                    FullName = custUser.FullName,
                    Email = custUser.Email,
                    Role = "Customer",
                    ClientCode = custUser.ClientCode,
                    CompanyName = custUser.CompanyName,
                    Expiry = DateTime.UtcNow.AddHours(12)
                };
            }

            return null;
        }

        // ── JWT TOKEN GENERATOR ───────────────────────────────
        private string GenerateToken(int id, string email, string fullName,
            string role, string? clientCode, string? companyName)
        {
            var jwt = _config.GetSection("JwtSettings");
            var key = new SymmetricSecurityKey(
                           Encoding.UTF8.GetBytes(jwt["SecretKey"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expiry = DateTime.UtcNow.AddHours(
                           double.Parse(jwt["ExpiryHours"] ?? "12"));

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, id.ToString()),
                new Claim(ClaimTypes.Email,          email),
                new Claim(ClaimTypes.Name,           fullName),
                new Claim(ClaimTypes.Role,           role),
            };

            if (!string.IsNullOrEmpty(clientCode))
                claims.Add(new Claim("ClientCode", clientCode));
            if (!string.IsNullOrEmpty(companyName))
                claims.Add(new Claim("CompanyName", companyName));

            var token = new JwtSecurityToken(
                issuer: jwt["Issuer"],
                audience: jwt["Audience"],
                claims: claims,
                expires: expiry,
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}