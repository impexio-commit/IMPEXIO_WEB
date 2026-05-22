namespace ImpexioAPI.DTOs
{
    public class IleRecordDto
    {
        public string RefNo { get; set; } = "";
        public string RefDate { get; set; } = "";
        public string? ResponseBy { get; set; }
        public string? FromCompany { get; set; }
        public string? FromContact { get; set; }
        public string? FromDesig { get; set; }
        public string? FromAddr { get; set; }
        public string? FromEmail { get; set; }
        public string? FromPhone { get; set; }
        public string? SupName { get; set; }
        public string? SupContact { get; set; }
        public string? SupCountry { get; set; }
        public string? SupAddr { get; set; }
        public string? SupEmail { get; set; }
        public string? SupWebsite { get; set; }
        public string? Pod { get; set; }
        public string? Incoterms { get; set; }
        public string? Container { get; set; }
        public string? DeliveryBy { get; set; }
        public string? Coo { get; set; }
        public string? PriceBasis { get; set; }
        public string? PaymentTerms { get; set; }
        public string? Currency { get; set; }
        public string? Moq { get; set; }
        public string? Remarks { get; set; }
        public string? PreparedBy { get; set; }
        public string? Signatory { get; set; }
        public string? Checklist { get; set; }

        public List<IleRowDto> Rows { get; set; } = new();
    }

    public class IleRowDto
    {
        public int SortOrder { get; set; }
        public string? Description { get; set; }
        public string? Hs { get; set; }
        public string? Qty { get; set; }
        public string? Unit { get; set; }
        public string? Spec { get; set; }
    }
}