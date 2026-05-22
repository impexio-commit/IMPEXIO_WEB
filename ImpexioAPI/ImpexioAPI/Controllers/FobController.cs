using ImpexioAPI.DTOs;
using ImpexioAPI.Models;
using ImpexioAPI.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace ImpexioAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FobController : ControllerBase
    {
        private readonly FobRepository _repo;

        public FobController(FobRepository repo)
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
        public async Task<IActionResult> Create([FromBody] FobRecordDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.FobNo))
                    return BadRequest(new { success = false, message = "FOB No is required." });

                if (string.IsNullOrWhiteSpace(dto.FobDate))
                    return BadRequest(new { success = false, message = "FOB Date is required." });

                var record = MapToModel(dto);
                var newId = await _repo.InsertAsync(record);

                return Ok(new { success = true, message = "FOB record created successfully.", data = newId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── UPDATE ───────────────────────────────────────────
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] FobRecordDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.FobNo))
                    return BadRequest(new { success = false, message = "FOB No is required." });

                var record = MapToModel(dto);
                var ok = await _repo.UpdateAsync(id, record);

                if (!ok)
                    return NotFound(new { success = false, message = "Record not found." });

                return Ok(new { success = true, message = "FOB record updated successfully." });
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

                return Ok(new { success = true, message = "FOB record deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── MAP DTO TO MODEL ─────────────────────────────────
        private static FobRecord MapToModel(FobRecordDto dto)
        {
            return new FobRecord
            {
                FobNo = dto.FobNo,
                FobDate = DateTime.TryParse(dto.FobDate, out var d) ? d : DateTime.Today,
                Company = dto.Company,
                Pol = dto.Pol,
                Remarks = dto.Remarks,
                PreparedBy = dto.PreparedBy,
                Signatory = dto.Signatory,
                Cbm20 = dto.Cbm20,
                Cbm40 = dto.Cbm40,
                Cbm40Hq = dto.Cbm40Hq,
                CbmLcl = dto.CbmLcl,
                Total20 = dto.Total20,
                Total40 = dto.Total40,
                Total40Hq = dto.Total40Hq,
                TotalLcl = dto.TotalLcl,
                Charges = dto.Charges.Select(c => new FobCharge
                {
                    ChargeKey = c.ChargeKey,
                    Amt20 = c.Amt20,
                    Amt40 = c.Amt40,
                    Amt40Hq = c.Amt40Hq,
                    AmtLcl = c.AmtLcl
                }).ToList()
            };
        }
    }
}