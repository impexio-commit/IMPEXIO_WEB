namespace ImpexioAPI.Models
{
    public class EcRecord
    {
        public int Id { get; set; }
        public string RefNo { get; set; } = "";
        public DateTime RatesDate { get; set; }
        public string? Company { get; set; }
        public string? Product { get; set; }
        public decimal? UsdRate { get; set; }
        public decimal? ShipRate { get; set; }
        public string? Remarks { get; set; }
        public string? PreparedBy { get; set; }
        public string? Signatory { get; set; }
        public string? SumFobInr { get; set; }
        public string? SumFobUsd { get; set; }
        public string? SumCifInr { get; set; }
        public string? SumCifUsd { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Child rows loaded separately
        public List<EcCell> Cells { get; set; } = new();
    }

    public class EcCell
    {
        public int Id { get; set; }
        public int EcRecordId { get; set; }
        public string RowKey { get; set; } = "";
        public string ColId { get; set; } = "";
        public string Mode { get; set; } = "";
        public decimal Value { get; set; }
    }
}