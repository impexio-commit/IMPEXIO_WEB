namespace ImpexioAPI.DTOs
{
    public class PiRecordDto
    {
        public string PiNo { get; set; } = "";
        public string PiDate { get; set; } = "";
        public string? ExpName { get; set; }
        public string? ExpAddr1 { get; set; }
        public string? ExpAddr2 { get; set; }
        public string? ExpAddr3 { get; set; }
        public string? BuyName { get; set; }
        public string? BuyAddr1 { get; set; }
        public string? BuyAddr2 { get; set; }
        public string? BuyAddr3 { get; set; }
        public string? CountryOrigin { get; set; }
        public string? CountryDest { get; set; }
        public string? Pol { get; set; }
        public string? Pod { get; set; }
        public string? Precarriage { get; set; }
        public string? Vessel { get; set; }
        public string? Incoterms { get; set; }
        public string? FinalDest { get; set; }
        public string? PaymentTerms { get; set; }
        public string? DeliveryTerms { get; set; }
        public string? Transhipment { get; set; }
        public string? PartialShipment { get; set; }
        public string? LeadTime { get; set; }
        public string? Validity { get; set; }
        public string? NetGrossWt { get; set; }
        public string? TotalCbm { get; set; }
        public string? Remarks { get; set; }
        public string? PreparedBy { get; set; }
        public string? Signatory { get; set; }
        public string? TotQty { get; set; }
        public string? TotBox { get; set; }
        public string? TotAmt { get; set; }
        public string? AmtWords { get; set; }

        public List<PiRowDto> Rows { get; set; } = new();
    }

    public class PiRowDto
    {
        public int SortOrder { get; set; }
        public string? Desc { get; set; }
        public string? Hs { get; set; }
        public string? Qty { get; set; }
        public string? Box { get; set; }
        public string? Rate { get; set; }
        public string? Amt { get; set; }
    }
}