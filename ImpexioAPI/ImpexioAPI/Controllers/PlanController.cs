using ImpexioAPI.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ImpexioAPI.Controllers
{
    [ApiController]
    [Route("api/admin/plans")]
    public class PlanController : ControllerBase
    {
        private readonly AdminRepository _repo;

        public PlanController(AdminRepository repo)
        {
            _repo = repo;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var plans = await _repo.GetAllPlansAsync();
                return Ok(new { success = true, data = plans });
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
                var plan = await _repo.GetPlanByIdAsync(id);
                if (plan == null)
                    return NotFound(new { success = false, message = "Plan not found." });
                return Ok(new { success = true, data = plan });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}