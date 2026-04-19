using System;

namespace OhmERP.Domain.Exceptions;

public class BusinessException : Exception
{
    public BusinessException(string message) : base(message)
    {
    }
}