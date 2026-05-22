using ImpexioAPI.DTOs;
using ImpexioAPI.Models;
using ImpexioAPI.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace ImpexioAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EfmController : ControllerBase
    {
        private readonly EfmRepository _repo;

        public EfmController(EfmRepository repo)
        {
            _repo = repo;
        }

        // ── GET ALL ──────────────────────────────────────────
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

        // ── GET BY ID ────────────────────────────────────────
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

        // ── INSERT ───────────────────────────────────────────
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] EfmRecordDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.RefNo))
                    return BadRequest(new { success = false, message = "Ref No is required." });

                if (string.IsNullOrWhiteSpace(dto.MailDate))
                    return BadRequest(new { success = false, message = "Mail Date is required." });

                if (string.IsNullOrWhiteSpace(dto.MailType))
                    return BadRequest(new { success = false, message = "Mail Type is required." });

                var record = MapToModel(dto);
                var newId = await _repo.InsertAsync(record);

                return Ok(new { success = true, message = "EFM record created successfully.", data = newId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── UPDATE ───────────────────────────────────────────
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] EfmRecordDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.RefNo))
                    return BadRequest(new { success = false, message = "Ref No is required." });

                var record = MapToModel(dto);
                var ok = await _repo.UpdateAsync(id, record);

                if (!ok)
                    return NotFound(new { success = false, message = "Record not found." });

                return Ok(new { success = true, message = "EFM record updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── DELETE ───────────────────────────────────────────
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var ok = await _repo.DeleteAsync(id);

                if (!ok)
                    return NotFound(new { success = false, message = "Record not found." });

                return Ok(new { success = true, message = "EFM record deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── MAP DTO TO MODEL ─────────────────────────────────
        private static EfmRecord MapToModel(EfmRecordDto dto)
        {
            return new EfmRecord
            {
                RefNo = dto.RefNo,
                MailDate = DateTime.TryParse(dto.MailDate, out var d1) ? d1 : DateTime.Today,
                MailType = dto.MailType,
                MailLabel = dto.MailLabel,
                MailIcon = dto.MailIcon,
                Product = dto.Product,
                DocRef = dto.DocRef,
                DocDate = DateTime.TryParse(dto.DocDate, out var d2) ? d2 : null,
                DocValue = dto.DocValue,
                FromCompany = dto.FromCompany,
                FromName = dto.FromName,
                FromDesig = dto.FromDesig,
                FromEmail = dto.FromEmail,
                FromPhone = dto.FromPhone,
                FromCity = dto.FromCity,
                ToName = dto.ToName,
                ToCompany = dto.ToCompany,
                ToCountry = dto.ToCountry,
                ToEmail = dto.ToEmail,
                SpecialNote = dto.SpecialNote,
                ExtraData = dto.ExtraData
            };
        }
    }
}