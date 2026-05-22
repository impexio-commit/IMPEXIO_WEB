using ImpexioAPI.DTOs;
using ImpexioAPI.Models;
using ImpexioAPI.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace ImpexioAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IleController : ControllerBase
    {
        private readonly IleRepository _repo;

        public IleController(IleRepository repo)
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
        public async Task<IActionResult> Create([FromBody] IleRecordDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.RefNo))
                    return BadRequest(new { success = false, message = "Ref No is required." });

                if (string.IsNullOrWhiteSpace(dto.RefDate))
                    return BadRequest(new { success = false, message = "Date is required." });

                var record = MapToModel(dto);
                var newId = await _repo.InsertAsync(record);

                return Ok(new { success = true, message = "ILE record created successfully.", data = newId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] IleRecordDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.RefNo))
                    return BadRequest(new { success = false, message = "Ref No is required." });

                var record = MapToModel(dto);
                var ok = await _repo.UpdateAsync(id, record);

                if (!ok)
                    return NotFound(new { success = false, message = "Record not found." });

                return Ok(new { success = true, message = "ILE record updated successfully." });
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

                return Ok(new { success = true, message = "ILE record deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        private static IleRecord MapToModel(IleRecordDto dto)
        {
            return new IleRecord
            {
                RefNo = dto.RefNo,
                RefDate = DateTime.TryParse(dto.RefDate, out var d1) ? d1 : DateTime.Today,
                ResponseBy = DateTime.TryParse(dto.ResponseBy, out var d2) ? d2 : null,
                FromCompany = dto.FromCompany,
                FromContact = dto.FromContact,
                FromDesig = dto.FromDesig,
                FromAddr = dto.FromAddr,
                FromEmail = dto.FromEmail,
                FromPhone = dto.FromPhone,
                SupName = dto.SupName,
                SupContact = dto.SupContact,
                SupCountry = dto.SupCountry,
                SupAddr = dto.SupAddr,
                SupEmail = dto.SupEmail,
                SupWebsite = dto.SupWebsite,
                Pod = dto.Pod,
                Incoterms = dto.Incoterms,
                Container = dto.Container,
                DeliveryBy = DateTime.TryParse(dto.DeliveryBy, out var d3) ? d3 : null,
                Coo = dto.Coo,
                PriceBasis = dto.PriceBasis,
                PaymentTerms = dto.PaymentTerms,
                Currency = dto.Currency,
                Moq = dto.Moq,
                Remarks = dto.Remarks,
                PreparedBy = dto.PreparedBy,
                Signatory = dto.Signatory,
                Checklist = dto.Checklist,
                Rows = dto.Rows.Select((r, i) => new IleRow
                {
                    SortOrder = i,
                    Description = r.Description,
                    Hs = r.Hs,
                    Qty = r.Qty,
                    Unit = r.Unit,
                    Spec = r.Spec
                }).ToList()
            };
        }
    }
}