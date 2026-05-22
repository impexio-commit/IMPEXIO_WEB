using ImpexioAPI.Data;
using ImpexioAPI.DTOs;
using ImpexioAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;

namespace ImpexioAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CbmController : ControllerBase
    {
        private readonly AppDbContext _db;
        public CbmController(AppDbContext db) { _db = db; }

        // ── GET all records ──────────────────────────────
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var records = await _db.CbmRecords
                .Include(r => r.Containers)
                .Include(r => r.Items)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
            return Ok(records);
        }

        // ── GET single record by ID ──────────────────────
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var record = await _db.CbmRecords
                .Include(r => r.Containers)
                .Include(r => r.Items)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (record == null) return NotFound();
            return Ok(record);
        }

        // ── POST create new record ───────────────────────
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CbmRecordDto dto)
        {
            var record = new CbmRecord
            {
                CbmNo = dto.CbmNo,
                CbmDate = dto.CbmDate,
                Company = dto.Company,
                Branch = dto.Branch,
                Location = dto.Location,
                DayBook = dto.DayBook,
                ListingNo = dto.ListingNo,
                Exporter = dto.Exporter,
                PreparedBy = dto.PreparedBy,
                Signatory = dto.Signatory,
                Remarks = dto.Remarks,
                CreatedAt = DateTime.Now,
                Containers = dto.Containers.Select(c => new CbmContainerSummary
                {
                    ContainerType = c.ContainerType,
                    Cbm = c.Cbm,
                    Mt = c.Mt,
                    Qty = c.Qty
                }).ToList(),
                Items = dto.Items.Select(i => new CbmItem
                {
                    CalcType = i.CalcType,
                    Description = i.Description,
                    Length = i.Length,
                    Width = i.Width,
                    Height = i.Height,
                    Boxes = i.Boxes,
                    Result = i.Result
                }).ToList()
            };

            _db.CbmRecords.Add(record);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Record saved successfully", id = record.Id });
        }

        // ── PUT update existing record ───────────────────
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CbmRecordDto dto)
        {
            var record = await _db.CbmRecords
                .Include(r => r.Containers)
                .Include(r => r.Items)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (record == null) return NotFound();

            record.CbmNo = dto.CbmNo;
            record.CbmDate = dto.CbmDate;
            record.Company = dto.Company;
            record.Branch = dto.Branch;
            record.Location = dto.Location;
            record.DayBook = dto.DayBook;
            record.ListingNo = dto.ListingNo;
            record.Exporter = dto.Exporter;
            record.PreparedBy = dto.PreparedBy;
            record.Signatory = dto.Signatory;
            record.Remarks = dto.Remarks;
            record.UpdatedAt = DateTime.Now;

            // Remove old and add new
            _db.CbmContainerSummaries.RemoveRange(record.Containers);
            _db.CbmItems.RemoveRange(record.Items);

            record.Containers = dto.Containers.Select(c => new CbmContainerSummary
            {
                ContainerType = c.ContainerType,
                Cbm = c.Cbm,
                Mt = c.Mt,
                Qty = c.Qty
            }).ToList();

            record.Items = dto.Items.Select(i => new CbmItem
            {
                CalcType = i.CalcType,
                Description = i.Description,
                Length = i.Length,
                Width = i.Width,
                Height = i.Height,
                Boxes = i.Boxes,
                Result = i.Result
            }).ToList();

            await _db.SaveChangesAsync();
            return Ok(new { message = "Record updated successfully" });
        }

        // ── DELETE record ────────────────────────────────
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var record = await _db.CbmRecords.FindAsync(id);
            if (record == null) return NotFound();

            _db.CbmRecords.Remove(record);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Record deleted successfully" });
        }
    }
}
