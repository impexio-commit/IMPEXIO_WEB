namespace ImpexioAPI.DTOs
{
    public class EfmRecordDto
    {
        public string RefNo { get; set; } = "";
        public string MailDate { get; set; } = "";
        public string? MailType { get; set; }
        public string? MailLabel { get; set; }
        public string? MailIcon { get; set; }
        public string? Product { get; set; }
        public string? DocRef { get; set; }
        public string? DocDate { get; set; }
        public string? DocValue { get; set; }
        public string? FromCompany { get; set; }
        public string? FromName { get; set; }
        public string? FromDesig { get; set; }
        public string? FromEmail { get; set; }
        public string? FromPhone { get; set; }
        public string? FromCity { get; set; }
        public string? ToName { get; set; }
        public string? ToCompany { get; set; }
        public string? ToCountry { get; set; }
        public string? ToEmail { get; set; }
        public string? SpecialNote { get; set; }
        public string? ExtraData { get; set; }
    }
}
