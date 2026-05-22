namespace ImpexioAPI.Models
{
    public class FobRecord
    {
        public int Id { get; set; }
        public string FobNo { get; set; } = "";
        public DateTime FobDate { get; set; }
        public string? Company { get; set; }
        public string? Pol { get; set; }
        public string? Remarks { get; set; }
        public string? PreparedBy { get; set; }
        public string? Signatory { get; set; }
        public decimal Cbm20 { get; set; }
        public decimal Cbm40 { get; set; }
        public decimal Cbm40Hq { get; set; }
        public decimal CbmLcl { get; set; }
        public decimal Total20 { get; set; }
        public decimal Total40 { get; set; }
        public decimal Total40Hq { get; set; }
        public decimal TotalLcl { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Child rows loaded separately
        public List<FobCharge> Charges { get; set; } = new();
    }

    public class FobCharge
    {
        public int Id { get; set; }
        public int FobRecordId { get; set; }
        public string ChargeKey { get; set; } = "";
        public decimal Amt20 { get; set; }
        public decimal Amt40 { get; set; }
        public decimal Amt40Hq { get; set; }
        public decimal AmtLcl { get; set; }
    }
}