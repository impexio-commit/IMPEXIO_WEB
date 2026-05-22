using Dapper;
using ImpexioAPI.Models;
using System.Data;

namespace ImpexioAPI.Repositories
{
    public class BilRepository
    {
        private readonly DbConnectionFactory _db;

        public BilRepository(DbConnectionFactory db)
        {
            _db = db;
        }

        public async Task<List<BilRecord>> GetAllAsync()
        {
            using var conn = _db.CreateConnection();
            return (await conn.QueryAsync<BilRecord>(
                "SP_BIL_GetAll",
                commandType: CommandType.StoredProcedure)).ToList();
        }

        public async Task<BilRecord?> GetByIdAsync(int id)
        {
            using var conn = _db.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync<BilRecord>(
                "SP_BIL_GetById",
                new { Id = id },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<int> InsertAsync(BilRecord rec)
        {
            using var conn = _db.CreateConnection();
            return await conn.QuerySingleAsync<int>(
                "SP_BIL_Insert",
                new
                {
                    rec.RefNo,
                    rec.RefDate,
                    rec.Source,
                    rec.BuyName,
                    rec.BuyCompany,
                    rec.BuyDesig,
                    rec.BuyAddr1,
                    rec.BuyCountry,
                    rec.BuyEmail,
                    rec.CoName,
                    rec.CoSince,
                    rec.CoCity,
                    rec.CoWebsite,
                    rec.CoEmail,
                    rec.CoPhone,
                    rec.Turnover,
                    rec.Countries,
                    rec.Certs,
                    rec.Capacity,
                    rec.Leadtime,
                    rec.ExpYears,
                    rec.SenderName,
                    rec.SenderDesig,
                    rec.SenderEmail,
                    rec.Product1,
                    rec.Hscode1,
                    rec.Product2,
                    rec.Hscode2,
                    rec.OtherProducts,
                    rec.Usp,
                    rec.Offer,
                    rec.Cta,
                    rec.Remarks
                },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> UpdateAsync(int id, BilRecord rec)
        {
            using var conn = _db.CreateConnection();
            var rows = await conn.ExecuteAsync(
                "SP_BIL_Update",
                new
                {
                    Id = id,
                    rec.RefNo,
                    rec.RefDate,
                    rec.Source,
                    rec.BuyName,
                    rec.BuyCompany,
                    rec.BuyDesig,
                    rec.BuyAddr1,
                    rec.BuyCountry,
                    rec.BuyEmail,
                    rec.CoName,
                    rec.CoSince,
                    rec.CoCity,
                    rec.CoWebsite,
                    rec.CoEmail,
                    rec.CoPhone,
                    rec.Turnover,
                    rec.Countries,
                    rec.Certs,
                    rec.Capacity,
                    rec.Leadtime,
                    rec.ExpYears,
                    rec.SenderName,
                    rec.SenderDesig,
                    rec.SenderEmail,
                    rec.Product1,
                    rec.Hscode1,
                    rec.Product2,
                    rec.Hscode2,
                    rec.OtherProducts,
                    rec.Usp,
                    rec.Offer,
                    rec.Cta,
                    rec.Remarks
                },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = _db.CreateConnection();
            var rows = await conn.ExecuteAsync(
                "SP_BIL_Delete",
                new { Id = id },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }
    }
}