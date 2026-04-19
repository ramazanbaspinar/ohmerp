namespace OhmERP.Domain.Common
{
    public abstract class AuditableEntity : BaseEntity
    {
        public DateTime CreatedDate { get; set; } = DateTime.Now;
        public Guid CreatedBy { get; set; }

        public DateTime? UpdatedDate { get; set; }
        public Guid? UpdatedBy { get; set; }

        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedDate { get; set; }
        public Guid? DeletedBy { get; set; }

        public byte[] RowVersion { get; set; } = null!;
    }
}