namespace OhmERP.Domain.Exceptions;

public class RelationExistsException : Exception
{
    public RelationExistsException(string message) : base(message)
    {
    }
}
