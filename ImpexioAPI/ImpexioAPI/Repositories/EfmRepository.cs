using Dapper;
using ImpexioAPI.Models;
using System.Data;

namespace ImpexioAPI.Repositories
{
    public class EfmRepository
    {
        private readonly DbConnectionFactory _db;

        public EfmRepository(DbConnectionFactory db)
        {
            _db = db;
        }

        // ── GET ALL ──────────────────────────────────────────
        public async Task<List<EfmRecord>> GetAllAsync()
        {
            using var conn = _db.CreateConnection();
            return (await conn.QueryAsync<EfmRecord>(
                "SP_EFM_GetAll",
                commandType: CommandType.StoredProcedure)).ToList();
        }

        // ── GET BY ID ────────────────────────────────────────
        public async Task<EfmRecord?> GetByIdAsync(int id)
        {
            using var conn = _db.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync<EfmRecord>(
                "SP_EFM_GetById",
                new { Id = id },
                commandType: CommandType.StoredProcedure);
        }

        // ── INSERT ───────────────────────────────────────────
        public async Task<int> InsertAsync(EfmRecord rec)
        {
            using var conn = _db.CreateConnection();
            return await conn.QuerySingleAsync<int>(
                "SP_EFM_Insert",
                new
                {
                    rec.RefNo,
                    rec.MailDate,
                    rec.MailType,
                    rec.MailLabel,
                    rec.MailIcon,
                    rec.Product,
                    rec.DocRef,
                    rec.DocDate,
                    rec.DocValue,
                    rec.FromCompany,
                    rec.FromName,
                    rec.FromDesig,
                    rec.FromEmail,
                    rec.FromPhone,
                    rec.FromCity,
                    rec.ToName,
                    rec.ToCompany,
                    rec.ToCountry,
                    rec.ToEmail,
                    rec.SpecialNote,
                    rec.ExtraData
                },
                commandType: CommandType.StoredProcedure);
        }

        // ── UPDATE ───────────────────────────────────────────
        public async Task<bool> UpdateAsync(int id, EfmRecord rec)
        {
            using var conn = _db.CreateConnection();
            var rows = await conn.ExecuteAsync(
                "SP_EFM_Update",
                new
                {
                    Id = id,
                    rec.RefNo,
                    rec.MailDate,
                    rec.MailType,
                    rec.MailLabel,
                    rec.MailIcon,
                    rec.Product,
                    rec.DocRef,
                    rec.DocDate,
                    rec.DocValue,
                    rec.FromCompany,
                    rec.FromName,
                    rec.FromDesig,
                    rec.FromEmail,
                    rec.FromPhone,
                    rec.FromCity,
                    rec.ToName,
                    rec.ToCompany,
                    rec.ToCountry,
                    rec.ToEmail,
                    rec.SpecialNote,
                    rec.ExtraData
                },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        // ── DELETE ───────────────────────────────────────────
        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = _db.CreateConnection();
            var rows = await conn.ExecuteAsync(
                "SP_EFM_Delete",
                new { Id = id },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }
    }
}