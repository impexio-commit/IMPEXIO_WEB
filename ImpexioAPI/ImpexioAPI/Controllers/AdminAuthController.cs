using ImpexioAPI.Models;
using ImpexioAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace ImpexioAPI.Controllers
{
    [ApiController]
    [Route("api/admin/auth")]
    public class AdminAuthController : ControllerBase
    {
        private readonly AdminAuthService _auth;

        public AdminAuthController(AdminAuthService auth)
        {
            _auth = auth;
        }

        // ── UNIFIED LOGIN ─────────────────────────────────────
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] AdminLoginRequest req)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(req.Email) ||
                    string.IsNullOrWhiteSpace(req.Password))
                    return BadRequest(new { success = false, message = "Email and Password are required." });

                var result = await _auth.LoginAsync(req);

                if (result == null)
                    return Unauthorized(new { success = false, message = "Invalid credentials or account not active." });

                return Ok(new { success = true, message = "Login successful.", data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}