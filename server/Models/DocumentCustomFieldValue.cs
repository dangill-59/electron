public class DocumentCustomFieldValue
{
    public int Id { get; set; }
    public int DocumentId { get; set; }
    public int ProjectId { get; set; }
    public int CustomFieldId { get; set; }
    public string Value { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}