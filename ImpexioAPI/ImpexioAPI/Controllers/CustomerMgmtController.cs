using ImpexioAPI.DTOs;
using ImpexioAPI.Models;
using ImpexioAPI.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ImpexioAPI.Controllers
{
    [ApiController]
    [Route("api/admin/customers")]
    [Authorize(Roles = "Owner")]
    public class CustomerMgmtController : ControllerBase
    {
        private readonly AdminRepository _repo;

        public CustomerMgmtController(AdminRepository repo)
        {
            _repo = repo;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var list = await _repo.GetAllCustomersAsync();
                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var item = await _repo.GetCustomerByIdAsync(id);
                if (item == null)
                    return NotFound(new { success = false, message = "Customer not found." });
                return Ok(new { success = true, data = item });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CustomerDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.CompanyName))
                    return BadRequest(new { success = false, message = "Company Name is required." });
                if (string.IsNullOrWhiteSpace(dto.Email))
                    return BadRequest(new { success = false, message = "Email is required." });
                if (string.IsNullOrWhiteSpace(dto.ClientCode))
                    return BadRequest(new { success = false, message = "Client Code is required." });

                var model = new Customer
                {
                    ClientCode = dto.ClientCode,
                    CompanyName = dto.CompanyName,
                    ContactPerson = dto.ContactPerson,
                    Email = dto.Email,
                    Phone = dto.Phone,
                    Address = dto.Address,
                    City = dto.City,
                    State = dto.State,
                    Country = dto.Country ?? "India",
                    GSTIN = dto.GSTIN,
                    IsActive = true
                };

                var newId = await _repo.InsertCustomerAsync(model);
                return Ok(new { success = true, message = "Customer created.", data = newId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] CustomerDto dto)
        {
            try
            {
                var model = new Customer
                {
                    CompanyName = dto.CompanyName,
                    ContactPerson = dto.ContactPerson,
                    Email = dto.Email,
                    Phone = dto.Phone,
                    Address = dto.Address,
                    City = dto.City,
                    State = dto.State,
                    Country = dto.Country ?? "India",
                    GSTIN = dto.GSTIN,
                    IsActive = dto.IsActive
                };
                await _repo.UpdateCustomerAsync(id, model);
                return Ok(new { success = true, message = "Customer updated." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _repo.DeleteCustomerAsync(id);
                return Ok(new { success = true, message = "Customer deactivated." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── CUSTOMER USERS ────────────────────────────────────
        [HttpGet("{customerId:int}/users")]
        public async Task<IActionResult> GetUsers(int customerId)
        {
            try
            {
                var users = await _repo.GetCustomerUsersByCustomerAsync(customerId);
                return Ok(new { success = true, data = users });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("{customerId:int}/users")]
        public async Task<IActionResult> CreateUser(int customerId, [FromBody] CustomerUserDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Email))
                    return BadRequest(new { success = false, message = "Email is required." });
                if (string.IsNullOrWhiteSpace(dto.Password))
                    return BadRequest(new { success = false, message = "Password is required." });

                var model = new CustomerUser
                {
                    CustomerId = customerId,
                    FullName = dto.FullName,
                    Email = dto.Email,
                    Phone = dto.Phone,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
                };

                var newId = await _repo.InsertCustomerUserAsync(model);
                return Ok(new { success = true, message = "User created.", data = newId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("users/{id:int}/toggle")]
        public async Task<IActionResult> ToggleUser(int id, [FromBody] CustomerUserToggleDto dto)
        {
            try
            {
                await _repo.ToggleCustomerUserAsync(id, dto.IsActive);
                return Ok(new { success = true, message = dto.IsActive ? "User activated." : "User deactivated." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── SUBSCRIPTIONS ─────────────────────────────────────
        [HttpGet("{customerId:int}/subscriptions")]
        public async Task<IActionResult> GetSubscriptions(int customerId)
        {
            try
            {
                var subs = await _repo.GetSubscriptionsByCustomerAsync(customerId);
                return Ok(new { success = true, data = subs });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("{customerId:int}/subscriptions")]
        public async Task<IActionResult> AddSubscription(int customerId, [FromBody] SubscriptionDto dto)
        {
            try
            {
                if (dto.PlanId == 0)
                    return BadRequest(new { success = false, message = "Plan is required." });

                var model = new Subscription
                {
                    CustomerId = customerId,
                    PlanId = dto.PlanId,
                    StartDate = DateTime.TryParse(dto.StartDate, out var s) ? s : DateTime.Today,
                    EndDate = DateTime.TryParse(dto.EndDate, out var e) ? e : DateTime.Today.AddMonths(3),
                    IsActive = dto.IsActive,
                    PaymentStatus = dto.PaymentStatus,
                    Notes = dto.Notes
                };

                var newId = await _repo.InsertSubscriptionAsync(model);
                return Ok(new { success = true, message = "Subscription added.", data = newId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("subscriptions/{id:int}/toggle")]
        public async Task<IActionResult> ToggleSubscription(int id, [FromBody] SubscriptionToggleDto dto)
        {
            try
            {
                await _repo.ToggleSubscriptionAsync(id, dto.IsActive);
                return Ok(new { success = true, message = dto.IsActive ? "Subscription activated." : "Subscription deactivated." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
}
