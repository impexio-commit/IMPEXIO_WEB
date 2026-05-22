namespace ImpexioAPI.DTOs
{
    public class FobRecordDto
    {
        public string FobNo { get; set; } = "";
        public string FobDate { get; set; } = "";
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

        public List<FobChargeDto> Charges { get; set; } = new();
    }

    public class FobChargeDto
    {
        public string ChargeKey { get; set; } = "";
        public decimal Amt20 { get; set; }
        public decimal Amt40 { get; set; }
        public decimal Amt40Hq { get; set; }
        public decimal AmtLcl { get; set; }
    }
}