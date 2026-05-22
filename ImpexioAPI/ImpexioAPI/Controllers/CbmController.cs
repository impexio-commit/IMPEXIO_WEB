using ImpexioAPI.DTOs;
using ImpexioAPI.Models;
using ImpexioAPI.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace ImpexioAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CbmController : ControllerBase
    {
        private readonly CbmRepository _repo;

        public CbmController(CbmRepository repo)
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
        public async Task<IActionResult> Create([FromBody] CbmRecordDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.CbmNo))
                    return BadRequest(new { success = false, message = "CBM No is required." });

                if (string.IsNullOrWhiteSpace(dto.CbmDate))
                    return BadRequest(new { success = false, message = "CBM Date is required." });

                var record = MapToModel(dto);
                var newId = await _repo.InsertAsync(record);

                return Ok(new { success = true, message = "CBM record created successfully.", data = newId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── UPDATE ───────────────────────────────────────────
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] CbmRecordDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.CbmNo))
                    return BadRequest(new { success = false, message = "CBM No is required." });

                var record = MapToModel(dto);
                var ok = await _repo.UpdateAsync(id, record);

                if (!ok)
                    return NotFound(new { success = false, message = "Record not found." });

                return Ok(new { success = true, message = "CBM record updated successfully." });
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

                return Ok(new { success = true, message = "CBM record deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── MAP DTO TO MODEL ─────────────────────────────────
        private static CbmRecord MapToModel(CbmRecordDto dto)
        {
            return new CbmRecord
            {
                CbmNo = dto.CbmNo,
                CbmDate = DateTime.TryParse(dto.CbmDate, out var d) ? d : DateTime.Today,
                DayBook = dto.DayBook,
                ListingNo = dto.ListingNo,
                Exporter = dto.Exporter,
                Company = dto.Company,
                Branch = dto.Branch,
                Location = dto.Location,
                PreparedBy = dto.PreparedBy,
                Signatory = dto.Signatory,
                Remarks = dto.Remarks,
                TotalCbm = dto.TotalCbm,
                TotalCft = dto.TotalCft,
                Items = dto.Items.Select((i, idx) => new CbmItem
                {
                    CalcType = i.CalcType,
                    Description = i.Description,
                    Length = i.Length,
                    Width = i.Width,
                    Height = i.Height,
                    Boxes = i.Boxes,
                    Result = i.Result,
                    SortOrder = idx
                }).ToList(),
                Containers = dto.Containers.Select(c => new CbmContainerSummary
                {
                    ContainerType = c.ContainerType,
                    Cbm = c.Cbm,
                    Mt = c.Mt,
                    Qty = c.Qty
                }).ToList()
            };
        }
    }
}