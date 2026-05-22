using System.Diagnostics;

namespace ImpexioAPI.Models
{
    public class CbmItem
    {
        public int Id { get; set; }
        public int CbmRecordId { get; set; }
        public string CalcType { get; set; } = string.Empty; // CBM or CFT
        public string? Description { get; set; }
        public decimal? Length { get; set; }
        public decimal? Width { get; set; }
        public decimal? Height { get; set; }
        public int? Boxes { get; set; }
        public decimal? Result { get; set; }

        // Navigation property
        public CbmRecord? CbmRecord { get; set; }
    }
}
