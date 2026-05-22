using Dapper;
using ImpexioAPI.Models;
using Microsoft.AspNetCore.Connections;
using System.Data;

namespace ImpexioAPI.Repositories
{
    public class CbmRepository
    {
        private readonly DbConnectionFactory _db;

        public CbmRepository(DbConnectionFactory db)
        {
            _db = db;
        }

        // ── GET ALL ──────────────────────────────────────────
        public async Task<List<CbmRecord>> GetAllAsync()
        {
            using var conn = _db.CreateConnection();

            var records = (await conn.QueryAsync<CbmRecord>(
                "SP_CBM_GetAll",
                commandType: CommandType.StoredProcedure)).ToList();

            foreach (var rec in records)
            {
                rec.Items = (await conn.QueryAsync<CbmItem>(
                    "SP_CBM_GetItems",
                    new { CbmRecordId = rec.Id },
                    commandType: CommandType.StoredProcedure)).ToList();

                rec.Containers = (await conn.QueryAsync<CbmContainerSummary>(
                    "SP_CBM_GetContainers",
                    new { CbmRecordId = rec.Id },
                    commandType: CommandType.StoredProcedure)).ToList();
            }

            return records;
        }

        // ── GET BY ID ────────────────────────────────────────
        public async Task<CbmRecord?> GetByIdAsync(int id)
        {
            using var conn = _db.CreateConnection();

            var record = await conn.QueryFirstOrDefaultAsync<CbmRecord>(
                "SP_CBM_GetById",
                new { Id = id },
                commandType: CommandType.StoredProcedure);

            if (record == null) return null;

            record.Items = (await conn.QueryAsync<CbmItem>(
                "SP_CBM_GetItems",
                new { CbmRecordId = id },
                commandType: CommandType.StoredProcedure)).ToList();

            record.Containers = (await conn.QueryAsync<CbmContainerSummary>(
                "SP_CBM_GetContainers",
                new { CbmRecordId = id },
                commandType: CommandType.StoredProcedure)).ToList();

            return record;
        }

        // ── INSERT ───────────────────────────────────────────
        public async Task<int> InsertAsync(CbmRecord rec)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction();

            try
            {
                // Insert main record
                var newId = await conn.QuerySingleAsync<int>(
                    "SP_CBM_Insert",
                    new
                    {
                        rec.CbmNo,
                        rec.CbmDate,
                        rec.DayBook,
                        rec.ListingNo,
                        rec.Exporter,
                        rec.Company,
                        rec.Branch,
                        rec.Location,
                        rec.PreparedBy,
                        rec.Signatory,
                        rec.Remarks,
                        rec.TotalCbm,
                        rec.TotalCft
                    },
                    transaction: tx,
                    commandType: CommandType.StoredProcedure);

                // Insert items
                foreach (var item in rec.Items)
                {
                    await conn.ExecuteAsync(
                        "SP_CBM_InsertItem",
                        new
                        {
                            CbmRecordId = newId,
                            item.CalcType,
                            item.Description,
                            item.Length,
                            item.Width,
                            item.Height,
                            item.Boxes,
                            item.Result,
                            item.SortOrder
                        },
                        transaction: tx,
                        commandType: CommandType.StoredProcedure);
                }

                // Insert containers
                foreach (var con in rec.Containers)
                {
                    await conn.ExecuteAsync(
                        "SP_CBM_InsertContainer",
                        new
                        {
                            CbmRecordId = newId,
                            con.ContainerType,
                            con.Cbm,
                            con.Mt,
                            con.Qty
                        },
                        transaction: tx,
                        commandType: CommandType.StoredProcedure);
                }

                tx.Commit();
                return newId;
            }
            catch
            {
                tx.Rollback();
                throw;
            }
        }

        // ── UPDATE ───────────────────────────────────────────
        public async Task<bool> UpdateAsync(int id, CbmRecord rec)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction();

            try
            {
                // Update main record
                var rows = await conn.ExecuteAsync(
                    "SP_CBM_Update",
                    new
                    {
                        Id = id,
                        rec.CbmNo,
                        rec.CbmDate,
                        rec.DayBook,
                        rec.ListingNo,
                        rec.Exporter,
                        rec.Company,
                        rec.Branch,
                        rec.Location,
                        rec.PreparedBy,
                        rec.Signatory,
                        rec.Remarks,
                        rec.TotalCbm,
                        rec.TotalCft
                    },
                    transaction: tx,
                    commandType: CommandType.StoredProcedure);

                if (rows == 0) { tx.Rollback(); return false; }

                // Delete old items and containers
                await conn.ExecuteAsync(
                    "SP_CBM_DeleteItems",
                    new { CbmRecordId = id },
                    transaction: tx,
                    commandType: CommandType.StoredProcedure);

                await conn.ExecuteAsync(
                    "SP_CBM_DeleteContainers",
                    new { CbmRecordId = id },
                    transaction: tx,
                    commandType: CommandType.StoredProcedure);

                // Reinsert items
                foreach (var item in rec.Items)
                {
                    await conn.ExecuteAsync(
                        "SP_CBM_InsertItem",
                        new
                        {
                            CbmRecordId = id,
                            item.CalcType,
                            item.Description,
                            item.Length,
                            item.Width,
                            item.Height,
                            item.Boxes,
                            item.Result,
                            item.SortOrder
                        },
                        transaction: tx,
                        commandType: CommandType.StoredProcedure);
                }

                // Reinsert containers
                foreach (var con in rec.Containers)
                {
                    await conn.ExecuteAsync(
                        "SP_CBM_InsertContainer",
                        new
                        {
                            CbmRecordId = id,
                            con.ContainerType,
                            con.Cbm,
                            con.Mt,
                            con.Qty
                        },
                        transaction: tx,
                        commandType: CommandType.StoredProcedure);
                }

                tx.Commit();
                return true;
            }
            catch
            {
                tx.Rollback();
                throw;
            }
        }

        // ── DELETE ───────────────────────────────────────────
        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = _db.CreateConnection();

            var rows = await conn.ExecuteAsync(
                "SP_CBM_Delete",
                new { Id = id },
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }
    }
}