namespace ImpexioAPI.Models
{
    public class SciRecord
    {
        public int Id { get; set; }
        public string InvNo { get; set; } = "";
        public DateTime InvDate { get; set; }
        public string? ConName { get; set; }
        public string? ConAddr1 { get; set; }
        public string? ConAddr2 { get; set; }
        public string? ConAddr3 { get; set; }
        public string? NotName { get; set; }
        public string? NotAddr1 { get; set; }
        public string? NotAddr2 { get; set; }
        public string? NotAddr3 { get; set; }
        public string? CountryOrigin { get; set; }
        public string? CountryDest { get; set; }
        public string? Pol { get; set; }
        public string? Pod { get; set; }
        public string? FinalDest { get; set; }
        public string? Vessel { get; set; }
        public string? Precarriage { get; set; }
        public string? PlaceReceipt { get; set; }
        public string? DeliveryTerms { get; set; }
        public string? PaymentTerms { get; set; }
        public string? Incoterms { get; set; }
        public string? OtherTerms { get; set; }
        public string? MarksNos { get; set; }
        public string? GrossNetWt { get; set; }
        public string? OtherRef { get; set; }
        public string? Remarks { get; set; }
        public string? PreparedBy { get; set; }
        public string? Signatory { get; set; }
        public string? TotQty { get; set; }
        public string? TotAmt { get; set; }
        public string? AmtWords { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Child rows loaded separately
        public List<SciRow> Rows { get; set; } = new();
    }

    public class SciRow
    {
        public int Id { get; set; }
        public int SciRecordId { get; set; }
        public int SortOrder { get; set; }
        public string? Description { get; set; }
        public string? Hs { get; set; }
        public string? Qty { get; set; }
        public string? Rate { get; set; }
        public string? Amt { get; set; }
    }
}