namespace ImpexioAPI.Models
{
    public class CbmContainerSummary
    {
        public int Id { get; set; }
        public int CbmRecordId { get; set; }
        public string ContainerType { get; set; } = string.Empty; // 20, 40GP, 40HQ, LCL
        public decimal? Cbm { get; set; }
        public decimal? Mt { get; set; }
        public int? Qty { get; set; }

        // Navigation property
        public CbmRecord? CbmRecord { get; set; }
    }
}