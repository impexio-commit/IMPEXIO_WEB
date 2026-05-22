using ImpexioAPI.DTOs;
using ImpexioAPI.Models;
using ImpexioAPI.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace ImpexioAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BilController : ControllerBase
    {
        private readonly BilRepository _repo;

        public BilController(BilRepository repo)
        {
            _repo = repo;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var records = await _repo.GetAllAsync();
                return Ok(new { success = true, data = records });
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
                var record = await _repo.GetByIdAsync(id);
                if (record == null)
                    return NotFound(new { success = false, message = "Record not found." });
                return Ok(new { success = true, data = record });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] BilRecordDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.RefNo))
                    return BadRequest(new { success = false, message = "Ref No is required." });
                if (string.IsNullOrWhiteSpace(dto.BuyName))
                    return BadRequest(new { success = false, message = "Buyer Name is required." });

                var record = MapToModel(dto);
                var newId = await _repo.InsertAsync(record);
                return Ok(new { success = true, message = "BIL record created successfully.", data = newId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] BilRecordDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.RefNo))
                    return BadRequest(new { success = false, message = "Ref No is required." });

                var record = MapToModel(dto);
                var ok = await _repo.UpdateAsync(id, record);
                if (!ok)
                    return NotFound(new { success = false, message = "Record not found." });
                return Ok(new { success = true, message = "BIL record updated successfully." });
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
                var ok = await _repo.DeleteAsync(id);
                if (!ok)
                    return NotFound(new { success = false, message = "Record not found." });
                return Ok(new { success = true, message = "BIL record deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        private static BilRecord MapToModel(BilRecordDto dto)
        {
            return new BilRecord
            {
                RefNo = dto.RefNo,
                RefDate = DateTime.TryParse(dto.RefDate, out var d) ? d : DateTime.Today,
                Source = dto.Source,
                BuyName = dto.BuyName,
                BuyCompany = dto.BuyCompany,
                BuyDesig = dto.BuyDesig,
                BuyAddr1 = dto.BuyAddr1,
                BuyCountry = dto.BuyCountry,
                BuyEmail = dto.BuyEmail,
                CoName = dto.CoName,
                CoSince = dto.CoSince,
                CoCity = dto.CoCity,
                CoWebsite = dto.CoWebsite,
                CoEmail = dto.CoEmail,
                CoPhone = dto.CoPhone,
                Turnover = dto.Turnover,
                Countries = dto.Countries,
                Certs = dto.Certs,
                Capacity = dto.Capacity,
                Leadtime = dto.Leadtime,
                ExpYears = dto.ExpYears,
                SenderName = dto.SenderName,
                SenderDesig = dto.SenderDesig,
                SenderEmail = dto.SenderEmail,
                Product1 = dto.Product1,
                Hscode1 = dto.Hscode1,
                Product2 = dto.Product2,
                Hscode2 = dto.Hscode2,
                OtherProducts = dto.OtherProducts,
                Usp = dto.Usp,
                Offer = dto.Offer,
                Cta = dto.Cta,
                Remarks = dto.Remarks
            };
        }
    }
}