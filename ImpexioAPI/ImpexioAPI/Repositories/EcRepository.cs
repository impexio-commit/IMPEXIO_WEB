using Dapper;
using ImpexioAPI.Models;
using System.Data;

namespace ImpexioAPI.Repositories
{
    public class EcRepository
    {
        private readonly DbConnectionFactory _db;

        public EcRepository(DbConnectionFactory db)
        {
            _db = db;
        }

        // ── GET ALL ──────────────────────────────────────────
        public async Task<List<EcRecord>> GetAllAsync()
        {
            using var conn = _db.CreateConnection();

            var records = (await conn.QueryAsync<EcRecord>(
                "SP_EC_GetAll",
                commandType: CommandType.StoredProcedure)).ToList();

            foreach (var rec in records)
            {
                rec.Cells = (await conn.QueryAsync<EcCell>(
                    "SP_EC_GetCells",
                    new { EcRecordId = rec.Id },
                    commandType: CommandType.StoredProcedure)).ToList();
            }

            return records;
        }

        // ── GET BY ID ────────────────────────────────────────
        public async Task<EcRecord?> GetByIdAsync(int id)
        {
            using var conn = _db.CreateConnection();

            var record = await conn.QueryFirstOrDefaultAsync<EcRecord>(
                "SP_EC_GetById",
                new { Id = id },
                commandType: CommandType.StoredProcedure);

            if (record == null) return null;

            record.Cells = (await conn.QueryAsync<EcCell>(
                "SP_EC_GetCells",
                new { EcRecordId = id },
                commandType: CommandType.StoredProcedure)).ToList();

            return record;
        }

        // ── INSERT ───────────────────────────────────────────
        public async Task<int> InsertAsync(EcRecord rec)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction();

            try
            {
                var newId = await conn.QuerySingleAsync<int>(
                    "SP_EC_Insert",
                    new
                    {
                        rec.RefNo,
                        rec.RatesDate,
                        rec.Company,
                        rec.Product,
                        rec.UsdRate,
                        rec.ShipRate,
                        rec.Remarks,
                        rec.PreparedBy,
                        rec.Signatory,
                        rec.SumFobInr,
                        rec.SumFobUsd,
                        rec.SumCifInr,
                        rec.SumCifUsd
                    },
                    transaction: tx,
                    commandType: CommandType.StoredProcedure);

                foreach (var cell in rec.Cells)
                {
                    await conn.ExecuteAsync(
                        "SP_EC_InsertCell",
                        new
                        {
                            EcRecordId = newId,
                            cell.RowKey,
                            cell.ColId,
                            cell.Mode,
                            cell.Value
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
        public async Task<bool> UpdateAsync(int id, EcRecord rec)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction();

            try
            {
                var rows = await conn.ExecuteAsync(
                    "SP_EC_Update",
                    new
                    {
                        Id = id,
                        rec.RefNo,
                        rec.RatesDate,
                        rec.Company,
                        rec.Product,
                        rec.UsdRate,
                        rec.ShipRate,
                        rec.Remarks,
                        rec.PreparedBy,
                        rec.Signatory,
                        rec.SumFobInr,
                        rec.SumFobUsd,
                        rec.SumCifInr,
                        rec.SumCifUsd
                    },
                    transaction: tx,
                    commandType: CommandType.StoredProcedure);

                if (rows == 0) { tx.Rollback(); return false; }

                // Delete old cells and reinsert
                await conn.ExecuteAsync(
                    "SP_EC_DeleteCells",
                    new { EcRecordId = id },
                    transaction: tx,
                    commandType: CommandType.StoredProcedure);

                foreach (var cell in rec.Cells)
                {
                    await conn.ExecuteAsync(
                        "SP_EC_InsertCell",
                        new
                        {
                            EcRecordId = id,
                            cell.RowKey,
                            cell.ColId,
                            cell.Mode,
                            cell.Value
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
                "SP_EC_Delete",
                new { Id = id },
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }
    }
}