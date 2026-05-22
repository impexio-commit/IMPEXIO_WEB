namespace ImpexioAPI.DTOs
{
    public class EcRecordDto
    {
        public string RefNo { get; set; } = "";
        public string RatesDate { get; set; } = "";
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

        public List<EcCellDto> Cells { get; set; } = new();
    }

    public class EcCellDto
    {
        public string RowKey { get; set; } = "";
        public string ColId { get; set; } = "";
        public string Mode { get; set; } = "";
        public decimal Value { get; set; }
    }
}