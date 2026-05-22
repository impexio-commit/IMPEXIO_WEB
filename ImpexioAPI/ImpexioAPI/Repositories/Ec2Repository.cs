using Dapper;
using ImpexioAPI.Models;
using System.Data;

namespace ImpexioAPI.Repositories
{
    public class Ec2Repository
    {
        private readonly DbConnectionFactory _db;

        public Ec2Repository(DbConnectionFactory db)
        {
            _db = db;
        }

        // ── GET ALL ──────────────────────────────────────────
        public async Task<List<Ec2Record>> GetAllAsync()
        {
            using var conn = _db.CreateConnection();

            var records = (await conn.QueryAsync<Ec2Record>(
                "SP_EC2_GetAll",
                commandType: CommandType.StoredProcedure)).ToList();

            foreach (var rec in records)
            {
                rec.Cells = (await conn.QueryAsync<Ec2Cell>(
                    "SP_EC2_GetCells",
                    new { Ec2RecordId = rec.Id },
                    commandType: CommandType.StoredProcedure)).ToList();
            }

            return records;
        }

        // ── GET BY ID ────────────────────────────────────────
        public async Task<Ec2Record?> GetByIdAsync(int id)
        {
            using var conn = _db.CreateConnection();

            var record = await conn.QueryFirstOrDefaultAsync<Ec2Record>(
                "SP_EC2_GetById",
                new { Id = id },
                commandType: CommandType.StoredProcedure);

            if (record == null) return null;

            record.Cells = (await conn.QueryAsync<Ec2Cell>(
                "SP_EC2_GetCells",
                new { Ec2RecordId = id },
                commandType: CommandType.StoredProcedure)).ToList();

            return record;
        }

        // ── INSERT ───────────────────────────────────────────
        public async Task<int> InsertAsync(Ec2Record rec)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction();

            try
            {
                var newId = await conn.QuerySingleAsync<int>(
                    "SP_EC2_Insert",
                    new
                    {
                        rec.RefNo,
                        rec.RateDate,
                        rec.Company,
                        rec.Product,
                        rec.UsdRate,
                        rec.Pol,
                        rec.PreparedBy,
                        rec.Signatory,
                        rec.SumFobInr,
                        rec.SumFobUsd,
                        rec.SumCifInr
                    },
                    transaction: tx,
                    commandType: CommandType.StoredProcedure);

                foreach (var cell in rec.Cells)
                {
                    await conn.ExecuteAsync(
                        "SP_EC2_InsertCell",
                        new
                        {
                            Ec2RecordId = newId,
                            cell.RowKey,
                            cell.ColId,
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
        public async Task<bool> UpdateAsync(int id, Ec2Record rec)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction();

            try
            {
                var rows = await conn.ExecuteAsync(
                    "SP_EC2_Update",
                    new
                    {
                        Id = id,
                        rec.RefNo,
                        rec.RateDate,
                        rec.Company,
                        rec.Product,
                        rec.UsdRate,
                        rec.Pol,
                        rec.PreparedBy,
                        rec.Signatory,
                        rec.SumFobInr,
                        rec.SumFobUsd,
                        rec.SumCifInr
                    },
                    transaction: tx,
                    commandType: CommandType.StoredProcedure);

                if (rows == 0) { tx.Rollback(); return false; }

                // Delete old cells and reinsert
                await conn.ExecuteAsync(
                    "SP_EC2_DeleteCells",
                    new { Ec2RecordId = id },
                    transaction: tx,
                    commandType: CommandType.StoredProcedure);

                foreach (var cell in rec.Cells)
                {
                    await conn.ExecuteAsync(
                        "SP_EC2_InsertCell",
                        new
                        {
                            Ec2RecordId = id,
                            cell.RowKey,
                            cell.ColId,
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
                "SP_EC2_Delete",
                new { Id = id },
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }
    }
}