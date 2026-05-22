using ImpexioAPI.DTOs;
using ImpexioAPI.Models;
using ImpexioAPI.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace ImpexioAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class Ec2Controller : ControllerBase
    {
        private readonly Ec2Repository _repo;

        public Ec2Controller(Ec2Repository repo)
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
        public async Task<IActionResult> Create([FromBody] Ec2RecordDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.RefNo))
                    return BadRequest(new { success = false, message = "Ref No is required." });

                if (string.IsNullOrWhiteSpace(dto.RateDate))
                    return BadRequest(new { success = false, message = "Rate Date is required." });

                var record = MapToModel(dto);
                var newId = await _repo.InsertAsync(record);

                return Ok(new { success = true, message = "EC2 record created successfully.", data = newId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── UPDATE ───────────────────────────────────────────
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] Ec2RecordDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.RefNo))
                    return BadRequest(new { success = false, message = "Ref No is required." });

                var record = MapToModel(dto);
                var ok = await _repo.UpdateAsync(id, record);

                if (!ok)
                    return NotFound(new { success = false, message = "Record not found." });

                return Ok(new { success = true, message = "EC2 record updated successfully." });
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

                return Ok(new { success = true, message = "EC2 record deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── MAP DTO TO MODEL ─────────────────────────────────
        private static Ec2Record MapToModel(Ec2RecordDto dto)
        {
            return new Ec2Record
            {
                RefNo = dto.RefNo,
                RateDate = DateTime.TryParse(dto.RateDate, out var d) ? d : DateTime.Today,
                Company = dto.Company,
                Product = dto.Product,
                UsdRate = dto.UsdRate,
                Pol = dto.Pol,
                PreparedBy = dto.PreparedBy,
                Signatory = dto.Signatory,
                SumFobInr = dto.SumFobInr,
                SumFobUsd = dto.SumFobUsd,
                SumCifInr = dto.SumCifInr,
                Cells = dto.Cells.Select(c => new Ec2Cell
                {
                    RowKey = c.RowKey,
                    ColId = c.ColId,
                    Value = c.Value
                }).ToList()
            };
        }
    }
}